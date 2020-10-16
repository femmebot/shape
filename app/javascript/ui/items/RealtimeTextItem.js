import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, toJS } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Delta from 'quill-delta'
import ReactQuill, { Quill } from 'react-quill'
// NOTE: quill-cursors injects a bunch of .ql-xx related styles into the <head>
import QuillCursors from 'quill-cursors'
import styled from 'styled-components'

import ActionCableConsumer from '~/utils/ActionCableConsumer'
import ChannelManager from '~/utils/ChannelManager'
import { CloseButton } from '~/ui/global/styled/buttons'
import QuillLink from '~/ui/global/QuillLink'
import QuillClipboard from '~/ui/global/QuillClipboard'
import {
  QuillHighlighter,
  QuillHighlightResolver,
} from '~/ui/global/QuillTextHighlighter'
import { QuillStyleWrapper } from '~/ui/global/styled/typography'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import v, { ITEM_CHANNEL_NAME } from '~/utils/variables'
import { objectsEqual } from '~/utils/objectUtils'

Quill.debug('error')
Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/customClipboard', QuillClipboard)
Quill.register('formats/link', QuillLink)
Quill.register(QuillHighlighter)
Quill.register(QuillHighlightResolver)

const Keyboard = Quill.import('modules/keyboard')

const CHANNEL_DISCONNECTED_MESSAGE = 'Connection lost, unable to edit.'

const FULL_PAGE_TOP_PADDING = '2rem'
const DockedToolbar = styled.div`
  height: 32px;
  margin-bottom: 20px;
  padding: 8px;
  position: absolute;
  z-index: ${v.zIndex.gridCardTop};

  .ql-toolbar {
    width: auto !important;
  }

  ${props =>
    props.fullPageView &&
    `
      margin-top: -${FULL_PAGE_TOP_PADDING};
      position: relative; /* IE fallback */
      padding-left: 0;
      @supports (position: sticky) {
        top: ${v.headerHeight}px;
        position: sticky;
      }
    `};
  ${props =>
    !props.fullPageView &&
    `
      width: 220px;
      padding-bottom: 26px;
      left: ${props.leftAdjust}px;
      transform: scale(${props.zoomLevel});
      background: ${v.colors.commonLightest};
      border-radius: 4px;
      box-sizing: border-box;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      top: ${props.topAdjust}px;
    `};
`
DockedToolbar.defaultProps = {
  zoomLevel: 1,
}

const StyledContainer = styled.div`
  position: relative;

  ${props =>
    props.fullPageView &&
    `
    height: 100%;
    padding: ${FULL_PAGE_TOP_PADDING} 0.5rem;`};
  ${props =>
    props.loading &&
    `
    background: gray;
  `} .editor-pill {
    ${props =>
      !props.fullPageView &&
      `
      bottom: 0;
      padding: 10px;
      position: absolute;
      top: 0;
      z-index: 10000;
    `};
  }
  ${props =>
    !props.fullPageView &&
    `
    height: calc(100% - 25px);
    .ql-tooltip.ql-editing,
    .ql-tooltip.ql-flip {
      left: calc(50% - 150px) !important;
      top: -20px !important;
      position: fixed;
      z-index: 10000;
    }
  `}
`

@inject('uiStore', 'apiStore', 'routingStore')
@observer
class RealtimeTextItem extends React.Component {
  unmounted = false
  state = {
    disconnected: false,
    canEdit: false,
  }
  saveTimer = null
  focused = false
  canceled = false
  currentlySending = false
  currentlySendingCheck = null
  num_viewers = 1
  version = null
  quillData = {}
  combinedDelta = new Delta()
  bufferDelta = new Delta()
  contentSnapshot = new Delta()
  @observable
  activeSizeFormat = null

  constructor(props) {
    super(props)
    this.reactQuillRef = undefined
    this.quillEditor = undefined
    this.sendCombinedDelta = _.debounce(this._sendCombinedDelta, 200)
    this.instanceTextContentUpdate = _.debounce(
      this._instanceTextContentUpdate,
      30000
    )
    this.sendCursor = _.throttle(this._sendCursor, 100)
    this.quillData = this.initialQuillData()
  }

  componentDidMount() {
    this.subscribeToItemRealtimeChannel()
    setTimeout(() => {
      if (this.unmounted) return
      // this slight delay seems to be help particularly for the full item page
      this.subscribeToItemRealtimeChannel()
      this.checkActionCableConnection()
    }, 1250)
    this.calculateCanEdit()
    if (!this.reactQuillRef) return

    this.initQuillRefsAndData({ initSnapshot: true })
    this.clearQuillClipboardHistory()
    this.setInitialSize()

    setTimeout(() => {
      this.quillEditor.focus()
      this.setInitialSize()
      this.clearQuillClipboardHistory()
    }, 100)
  }

  componentDidUpdate(prevProps, prevState) {
    setTimeout(() => {
      // note: didUpdate seems to clear the transient highlight, manually re-add it again
      // will cause a subtle flickering effect when clicking into a text-item's highlight
      this.reapplyActiveHighlight()
    }, 100)
    const initSnapshot = !prevProps.fullyLoaded && this.props.fullyLoaded
    // if we just "fully loaded" then make sure to update this.contentSnapshot and version
    this.initQuillRefsAndData({ initSnapshot })
    if (initSnapshot || prevState.disconnected !== this.state.disconnected) {
      this.calculateCanEdit()
    }
  }

  componentWillUnmount() {
    this.unmounted = true
    // this will set the datx item to have the right data, but do not want to route back
    this.cancel(null, { route: false })
    // check if you're leaving to go to the same item, e.g. item on CollectionPage -> ItemPage
    // in which case we keep the channel open
    const { routingTo } = this.props.routingStore
    const { item } = this.props
    const routingToSameItem =
      routingTo.id === item.id && routingTo.type === 'items'
    if (routingToSameItem) return
    ChannelManager.unsubscribe(ITEM_CHANNEL_NAME, item.id)
    item.setCollaborators([])
  }

  clearQuillClipboardHistory() {
    // guard for jest
    if (!this.quillEditor) return
    // fix for undo clearing out all text
    // https://github.com/zenoamaro/react-quill/issues/511
    this.quillEditor.history.clear()
  }

  setInitialSize() {
    const { version, quillEditor } = this
    const { initialSize } = this.props
    if (!quillEditor || initialSize === 'normal' || version > 1) {
      // version > 1 means we are not in a brand new text item
      return
    }
    const range = quillEditor.getSelection()
    if (range && range.index) {
      quillEditor.formatText(0, range.index, 'size', initialSize, 'user')
    }
    quillEditor.format('size', initialSize)
  }

  checkActionCableConnection() {
    if (ActionCableConsumer.connection.disconnected) {
      this.channelDisconnected()
      return false
    }
    return true
  }

  reapplyActiveHighlight() {
    const { uiStore } = this.props
    const activeHighlightNode = document.querySelector(
      `sub[data-comment-id="${uiStore.replyingToCommentId}"]`
    )
    if (activeHighlightNode) {
      activeHighlightNode.classList.add('highlightActive')
    }
  }

  subscribeToItemRealtimeChannel() {
    const { item } = this.props
    this.channel = ChannelManager.subscribe(ITEM_CHANNEL_NAME, item.id, {
      channelConnected: this.channelConnected,
      channelDisconnected: this.channelDisconnected,
      channelReceivedData: this.channelReceivedData,
    })
  }

  initQuillRefsAndData = ({ initSnapshot } = {}) => {
    if (!this.reactQuillRef) return
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    this.quillEditor = this.reactQuillRef.getEditor()

    if (!initSnapshot) return
    this.version = this.props.item.version
    this.contentSnapshot = this.quillEditor.getContents()
    this.updateUiStoreSnapshot()
  }

  createCursor({ id, name }) {
    const { uiStore } = this.props
    const { collaboratorColors } = uiStore
    const cursors = this.quillEditor.getModule('cursors')
    let cursorColor = v.colors.tertiaryMedium
    if (collaboratorColors.has(id)) {
      cursorColor =
        v.colors[`collaboratorSecondary${collaboratorColors.get(id)}`]
    }
    cursors.createCursor(id, name, cursorColor)
  }

  channelConnected = () => {
    if (this.unmounted) return
    this.setState({ disconnected: false }, () => {
      this.clearQuillClipboardHistory()
    })
  }

  // NOTE: ActionCable websocket should automatically/continually try to reconnect on its own
  channelDisconnected = ({ message = CHANNEL_DISCONNECTED_MESSAGE } = {}) => {
    if (this.unmounted) return
    const { uiStore, fullPageView } = this.props
    uiStore.popupSnackbar({
      message,
      showRefresh: true,
      backgroundColor: v.colors.alert,
    })
    if (!fullPageView) {
      // this will cancel you out of the editor back to view-only mode
      this.cancel()
      return
    }
    // this will likewise put you into readOnly mode on the ItemPage
    this.setState({ disconnected: true })
  }

  channelReceivedData = ({
    current_editor,
    data,
    num_viewers,
    collaborators,
  }) => {
    if (this.unmounted) return
    // you may just be receiving data about someone joining/leaving
    this.num_viewers = num_viewers
    if (!data) return

    if (data.version) {
      this.handleReceivedDelta({ current_editor, data })
    }
    if (data.range) {
      this.handleReceivedRange({ current_editor, data })
    }

    const { item } = this.props
    item.setCollaborators(collaborators)
  }

  handleReceivedRange = ({ current_editor, data }) => {
    if (current_editor.id === this.props.currentUserId) return
    // createCursor is like a find_or_create
    this.createCursor(current_editor)
    const cursors = this.quillEditor.getModule('cursors')
    cursors.moveCursor(current_editor.id, data.range)
  }

  handleReceivedDelta = ({ current_editor, data }) => {
    const { currentUserId } = this.props

    // update our local version number
    if (data.version && data.last_10) {
      const diff = data.version - this.version
      if (diff > 0) {
        _.each(data.last_10, previous => {
          const delta = new Delta(previous.delta)
          if (previous.version > this.version) {
            if (previous.editor_id !== currentUserId) {
              this.applyIncomingDelta(delta)
            }
            // update for later sending appropriately composed version to be saved
            this.contentSnapshot = this.contentSnapshot.compose(delta)
            // set our local version to match the realtime data we got
            this.version = previous.version
          }
        })
      }
    }

    if (current_editor.id === currentUserId) {
      // now we can successfully say that our delta was sent/received
      clearTimeout(this.currentlySendingCheck)
      this.currentlySendingCheck = null
      this.currentlySending = false
      if (data.error && data.error === 'locked') {
        // try to resend
        this.sendCombinedDelta()
        return
      }
      // clear out our combinedDelta with whatever had been typed in the meantime
      this.combinedDelta = this.bufferDelta.slice()
      if (this.combinedDelta.length()) {
        // if we had some waiting content
        this.sendCombinedDelta()
      }
    }
    if (this.focused) this.sendCursor()
  }

  applyIncomingDelta(remoteDelta) {
    // this.quillEditor may not exist in unit tests
    if (this.quillEditor) {
      // apply the incoming other person's delta, accounting for our own changes,
      // but prioritizing theirs
      const remoteDeltaWithLocalChanges = this.combinedDelta.transform(
        remoteDelta
      )
      // make sure our local editor is up to date with changes.
      this.quillEditor.updateContents(remoteDeltaWithLocalChanges, 'silent')
      // persist local changes
      this.updateUiStoreSnapshot()
    }

    if (this.combinedDelta.length()) {
      // transform our awaiting content, prioritizing the remote delta
      this.combinedDelta = remoteDelta.transform(this.combinedDelta, true)
    }
  }

  calculateCanEdit() {
    const { item, fullyLoaded } = this.props
    const { disconnected } = this.state
    const canEdit = item.can_edit_content && fullyLoaded && !disconnected
    if (canEdit !== this.state.canEdit) {
      this.setState({ canEdit }, () => {
        // one additional case to clear this, going from canEdit false -> true
        if (canEdit) this.clearQuillClipboardHistory()
      })
    }
  }

  initialQuillData() {
    const { item } = this.props
    const quillData = toJS(item.quill_data) || {}
    if (!quillData.ops) quillData.ops = []
    return quillData
  }

  cancel = (ev, { route = true } = {}) => {
    if (this.canceled) return
    const { onCancel } = this.props
    const { canEdit } = this.state
    // mark this as it may get called again from unmount, only want to cancel once
    this.canceled = true
    this.sendCombinedDelta.flush()
    this.instanceTextContentUpdate.flush()
    // event is passed through because TextItemCover uses it
    if (!canEdit) return onCancel({ item: this.props.item, ev, route })

    const item = this.setItemQuillData()
    this.pushTextUndo()
    // tell the TextItemCover about number of viewers so it can know whether to perform an additional save
    return onCancel({ item, ev, route, num_viewers: this.num_viewers })
  }

  pushTextUndo() {
    const { item, uiStore } = this.props
    const collection = uiStore.viewingCollection || item.parent
    const redirectTo = collection
    const previousData = this.quillData
    const currentData = item.quill_data
    if (objectsEqual(previousData, currentData)) {
      return
    }
    item.pushTextUndo({ previousData, currentData, redirectTo })
  }

  @action
  setItemQuillData() {
    const { item } = this.props
    const { quillEditor, version } = this
    item.version = version
    if (!quillEditor) {
      return item
    }

    // scrub any "new" unpersisted highlights
    const delta = new Delta(quillEditor.getContents())
    const ops = _.map(delta.ops, op => {
      if (op.attributes && op.attributes.commentHighlight === 'new') {
        delete op.attributes.commentHighlight
      }
      return op
    })
    delta.ops = ops
    quillEditor.setContents(delta)
    item.content = quillEditor.root.innerHTML
    item.quill_data = delta
    return item
  }

  updateUiStoreSnapshot(fullContent = null) {
    const { uiStore } = this.props
    const { quillEditor } = this
    const delta = fullContent || (quillEditor && quillEditor.getContents())
    uiStore.update('quillSnapshot', delta)
  }

  get cardId() {
    const { item } = this.props
    if (item.parent_collection_card) {
      return item.parent_collection_card.id
    } else {
      return null
    }
  }

  handleTextChange = (_content, delta, source, _editor) => {
    if (source !== 'user') return
    const cursors = this.quillEditor.getModule('cursors')
    cursors.clearCursors()

    this.combineAwaitingDeltas(delta)
    const connected = this.checkActionCableConnection()
    if (connected) {
      this.sendCombinedDelta()
      this.instanceTextContentUpdate()
    }
    // NOTE: trying to check titleText only if the delta turned header on/off
    // seemed to miss some cases, so we just check every time
    this.checkForTitleText()
  }

  handleSelectionChange = (range, source, editor) => {
    const { cardId, quillEditor } = this
    const { uiStore } = this.props

    if (!cardId) return

    uiStore.selectTextRangeForCard({
      range,
      quillEditor,
      cardId,
    })
    // also store editor.getContents(range) for later reference
    if (source === 'user') {
      this.sendCursor()
      if (range) this.checkActiveSizeFormat()
    }
  }

  combineAwaitingDeltas = delta => {
    this.combinedDelta = this.combinedDelta.compose(delta)
    this.bufferDelta = this.bufferDelta.compose(delta)
  }

  _sendCursor = () => {
    if (!this.quillEditor || this.num_viewers === 1) return
    this.socketSend('cursor', {
      range: this.quillEditor.getSelection(),
    })
  }

  _sendCombinedDelta = () => {
    if (!this.combinedDelta.length() || this.currentlySending) {
      if (this.currentlySending && !this.currentlySendingCheck) {
        this.currentlySendingCheck = setTimeout(() => {
          // if we are stuck 15s in this `currentlySending` mode it means our socketSends are
          // silently failing... we've probably been unsubscribed and it's throwing a backend error
          if (this.currentlySending) {
            this.channelDisconnected({ message: 'Disconnected from server' })
          }
        }, 10 * 1000)
      }
      return false
    }

    this.currentlySending = true
    const full_content = this.contentSnapshot.compose(this.combinedDelta)
    // persist the change locally e.g. when we close the text box
    this.updateUiStoreSnapshot(full_content)

    // NOTE: will get rejected if this.version < server saved version,
    // in which case the handleReceivedDelta error will try to resend
    this.socketSend('delta', {
      version: this.version,
      delta: this.combinedDelta,
      full_content,
      current_user_id: this.props.currentUserId,
    })
    this.sendCursor()

    // now that we have sent off our data, we can clear out what's in our buffer;
    // our combinedDelta won't clear out until we know it has successfully sent
    this.bufferDelta = new Delta()
    return this.combinedDelta
  }

  _instanceTextContentUpdate = () => {
    const { item, uiStore } = this.props
    const { type, parent } = item
    const instanceParentCollection = parent || uiStore.viewingCollection
    if (
      instanceParentCollection &&
      instanceParentCollection.isTemplate &&
      this.cardId &&
      type
    ) {
      const ids = [this.cardId]
      instanceParentCollection.API_backgroundUpdateTemplateInstances({
        type,
        ids,
      })
    }
  }

  socketSend = (method, data) => {
    const channel = ChannelManager.getChannel(
      ITEM_CHANNEL_NAME,
      this.props.item.id
    )
    if (!channel) {
      this.channelDisconnected()
      return
    }
    this.channel.perform(method, data)
  }

  handleKeyDown = e => {
    if (e.key === 'Escape') {
      this.cancel()
    }
  }

  handleFocus = e => {
    const { item, uiStore } = this.props
    if (this.focused) return
    this.focused = true
    // any time the text editor receives focus...
    // you are effectively "leaving" commenting, should clear out commentingOnRecord
    if (uiStore.commentingOnRecord === item) {
      uiStore.setCommentingOnRecord(null)
    }
  }

  onComment = async e => {
    e.preventDefault()
    const { apiStore, uiStore, item } = this.props
    const { range } = uiStore.selectedTextRangeForCard
    // prevent commenting without a selected range
    if (!range || range.length === 0) return
    apiStore.openCurrentThreadToCommentOn(item)
  }

  toggleSize = size => e => {
    e.preventDefault()
    const { quillEditor } = this
    const currentFormat = quillEditor.getFormat()
    let val = size
    if (currentFormat.size === size) {
      val = null
    }
    quillEditor.format('header', false, 'user')
    quillEditor.format('size', val, 'user')
    this.checkActiveSizeFormat()
  }

  toggleHeader = header => e => {
    e.preventDefault()
    const { quillEditor } = this
    const range = quillEditor.getSelection()
    if (!range) return
    const lines = quillEditor.getLines(range.index)
    const currentFormat = quillEditor.getFormat()
    _.each(lines, line => {
      quillEditor.removeFormat(line.offset(), line.length(), 'user')
    })
    if (currentFormat.header !== header) {
      quillEditor.format('size', null, 'user')
      quillEditor.format('header', header, 'user')
    }
    this.checkActiveSizeFormat()
  }

  checkForTitleText = () => {
    const { uiStore } = this.props
    let hasTitle = false
    const contents = this.quillEditor.getContents()
    _.each(contents.ops, op => {
      if (op.attributes && op.attributes.header === 5) {
        hasTitle = true
      }
    })
    uiStore.update('textEditingItemHasTitleText', hasTitle)
  }

  @action
  checkActiveSizeFormat = () => {
    if (this.unmounted) return
    const format = this.quillEditor.getFormat()
    this.activeSizeFormat =
      format.header && format.header === 5 ? 'title' : format.size
  }

  endOfHighlight = (range, context) => {
    if (!context.format || !context.format.commentHighlight) {
      return false
    }
    const nextFormat = this.quillEditor.getFormat(range.index + 1)
    if (nextFormat && nextFormat.commentHighlight) {
      return false
    }
    return true
  }

  insertText = (index, char) => {
    this.quillEditor.insertText(
      index,
      char,
      {
        commentHighlight: false,
        'data-comment-id': null,
      },
      'user'
    )
    this.quillEditor.setSelection(index + 1)
  }

  keyHandler_enter = (range, context) => {
    if (this.endOfHighlight(range, context)) {
      this.insertText(range.index, '\n')
    } else {
      // propagate to quill default newline behavior
      return true
    }
  }

  keyHandler_space = (range, context) => {
    if (this.endOfHighlight(range, context)) {
      this.insertText(range.index, ' ')
    } else {
      // propagate to quill default newline behavior
      return true
    }
  }

  render() {
    const { item, uiStore, onExpand, fullPageView, containerRef } = this.props
    const { textEditingItemHasTitleText, relativeZoomLevel } = uiStore
    const { canEdit } = this.state
    // item is not fully loaded yet, e.g. from a CommentThread
    if (!item.quill_data) {
      return null
    }

    // NOTE: if anything changes these props e.g. state.canEdit
    // then ReactQuill will regenerate the underlying component
    // and we have to make sure to call clearQuillClipboardHistory()
    const quillProps = {
      ...v.quillDefaults,
      ref: c => {
        this.reactQuillRef = c
      },
      theme: 'snow',
      onChange: this.handleTextChange,
      onChangeSelection: this.handleSelectionChange,
      onFocus: this.handleFocus,
      onBlur: e => {
        this.focused = false
      },
      readOnly: !canEdit,
      modules: {
        customClipboard: true,
        toolbar: canEdit ? '#quill-toolbar' : null,
        cursors: {
          hideDelayMs: 3000,
        },
        keyboard: {
          bindings: {
            enter: {
              key: Keyboard.keys.ENTER,
              handler: this.keyHandler_enter,
            },
            space: {
              key: 32,
              handler: this.keyHandler_space,
            },
          },
        },
      },
    }

    // this is for adjusting where the fully scaled toolbar appears above the card
    let leftAdjustToolbar = -16
    let topAdjustToolbar = -52
    if (relativeZoomLevel > 2) {
      leftAdjustToolbar = Math.pow(relativeZoomLevel, 1.5) * 33
      topAdjustToolbar = -52 - Math.pow(relativeZoomLevel, 1.3) * 9
    } else if (relativeZoomLevel > 1) {
      leftAdjustToolbar = Math.pow(relativeZoomLevel, 1.5) * 24
      topAdjustToolbar = Math.pow(relativeZoomLevel, 1.3) * -36
    }

    return (
      <StyledContainer
        ref={c => (containerRef ? containerRef(c) : null)}
        className="no-drag"
        fullPageView={fullPageView}
      >
        <DockedToolbar
          fullPageView={fullPageView}
          zoomLevel={!fullPageView ? uiStore.relativeZoomLevel : 1}
          leftAdjust={leftAdjustToolbar}
          topAdjust={topAdjustToolbar}
        >
          {canEdit && (
            <TextItemToolbar
              onExpand={onExpand}
              toggleSize={this.toggleSize}
              toggleHeader={this.toggleHeader}
              onComment={this.onComment}
              activeSizeFormat={this.activeSizeFormat}
            />
          )}
          <CloseButton
            data-cy="TextItemClose"
            className="ql-close"
            onClick={this.cancel}
            size={fullPageView ? 'lg' : 'sm'}
            style={{ right: '8px', top: '11px' }}
          />
        </DockedToolbar>
        <QuillStyleWrapper
          hasTitleText={textEditingItemHasTitleText}
          fullPageView={fullPageView}
        >
          <ReactQuill
            {...quillProps}
            defaultValue={this.quillData}
            onKeyDown={this.handleKeyDown}
          />
        </QuillStyleWrapper>
      </StyledContainer>
    )
  }
}

RealtimeTextItem.displayName = 'RealtimeTextItem'

RealtimeTextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  currentUserId: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  fullyLoaded: PropTypes.bool.isRequired,
  onExpand: PropTypes.func,
  fullPageView: PropTypes.bool,
  initialSize: PropTypes.oneOf(['normal', 'huge', 'large']),
  containerRef: PropTypes.func,
}
RealtimeTextItem.defaultProps = {
  currentUserId: null,
  onExpand: null,
  fullPageView: false,
  initialSize: 'normal',
  containerRef: null,
}
RealtimeTextItem.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default RealtimeTextItem
