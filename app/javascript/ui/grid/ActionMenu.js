import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import AddIntoIcon from '~/ui/icons/AddIntoIcon'
import Activity from '~/stores/jsonApi/Activity'
import DownloadIcon from '~/ui/icons/DownloadIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import MoveIcon from '~/ui/icons/MoveIcon'
import ReplaceIcon from '~/ui/icons/ReplaceIcon'
import SharingIcon from '~/ui/icons/SharingIcon'
import SubmissionBoxIconSm from '~/ui/icons/SubmissionBoxIconSm'
import PopoutMenu from '~/ui/global/PopoutMenu'
import TagIcon from '~/ui/icons/TagIcon'
import TrashXlIcon from '~/ui/icons/TrashXlIcon'

@inject('uiStore')
@observer
class ActionMenu extends React.Component {
  @observable
  itemLoading = ''

  @action
  setLoading(name = '') {
    this.itemLoading = name
  }

  callCardAction = async (name, methodName) => {
    const { uiStore, card } = this.props
    let onCancel
    if (methodName === 'API_archive') {
      uiStore.selectCardId(card.id)
      onCancel = () => {
        uiStore.toggleSelectedCardId(card.id)
      }
      uiStore.closeMoveMenu({ deselect: false })
    } else {
      uiStore.closeMoveMenu({ deselect: true })
    }
    this.setLoading(name)
    const result = await card[methodName]({ onCancel })
    this.setLoading()
    return result
  }

  replaceCard = () => {
    this.props.uiStore.closeMoveMenu()
    const { card } = this.props
    card.beginReplacing()
  }

  openMoveMenu = cardAction => {
    const { card, onMoveMenu, uiStore } = this.props
    if (onMoveMenu) onMoveMenu({ type: cardAction })
    uiStore.selectCardId(card.id)
    uiStore.openMoveMenu({ from: this.movingFromCollectionId, cardAction })
  }

  closeCardMenu = () => {
    this.props.uiStore.closeCardMenu()
  }

  duplicateCard = () => {
    this.openMoveMenu('duplicate')
  }

  moveCard = () => {
    const { card, uiStore } = this.props
    const collection = card.parentCollection
    collection.confirmEdit({
      onCancel: () => uiStore.closeMoveMenu(),
      onConfirm: () => this.openMoveMenu('move'),
    })
  }

  linkCard = () => {
    this.openMoveMenu('link')
  }

  addToMyCollection = () => {
    this.callCardAction('Add to My Collection', 'API_linkToMyCollection')
  }

  archiveCard = async () => {
    const { afterArchive } = this.props
    const result = await this.callCardAction('Delete', 'API_archive')
    if (afterArchive && result) afterArchive({ type: 'archive' })
  }

  showTags = () => {
    const { card, uiStore } = this.props
    uiStore.update('tagsModalOpenId', card.id)
  }

  downloadCard = () => {
    const { card } = this.props
    const { record } = card
    if (record.filestack_file) {
      Activity.trackActivity('downloaded', record)
      window.open(record.filestack_file.url, '_blank')
    }
  }

  showRolesMenu = () => {
    const { uiStore, card } = this.props
    uiStore.update('rolesMenuOpen', card.record)
  }

  handleMouseLeave = () => {
    this.props.onLeave()
  }

  toggleOpen = e => {
    e.stopPropagation()
    this.props.onOpen(e)
  }

  openSubmissionBoxSettings = () => {
    const { uiStore } = this.props
    uiStore.update('submissionBoxSettingsOpen', true)
  }

  get movingFromCollectionId() {
    const { card, uiStore, location } = this.props
    // For PageMenu we're moving "from" the parent collection
    // Viewing collection could also be null if on the search page
    if (location === 'PageMenu' || !uiStore.viewingCollection) {
      return card.parent_id
    }
    return uiStore.viewingCollection.id
  }

  get menuItems() {
    const {
      canView,
      canEdit,
      card,
      canReplace,
      submissionBox,
      location,
      testCollectionCard,
      uiStore,
    } = this.props
    const { record } = card

    const actions = [
      {
        name: 'Duplicate',
        iconRight: <DuplicateIcon />,
        onClick: this.duplicateCard,
      },
      { name: 'Move', iconRight: <MoveIcon />, onClick: this.moveCard },
      { name: 'Link', iconRight: <LinkIcon />, onClick: this.linkCard },
      {
        name: 'Add to My Collection',
        iconRight: <AddIntoIcon />,
        onClick: this.addToMyCollection,
      },
      {
        name: 'Download',
        iconRight: <DownloadIcon />,
        onClick: this.downloadCard,
      },
      { name: 'Tags', iconRight: <TagIcon />, onClick: this.showTags },
      {
        name: 'Sharing',
        iconRight: <SharingIcon />,
        onClick: this.showRolesMenu,
      },
      {
        name: 'Delete',
        iconRight: <TrashXlIcon />,
        onClick: this.archiveCard,
      },
      {
        name: 'Replace',
        iconRight: <ReplaceIcon />,
        onClick: this.replaceCard,
      },
    ]
    actions.forEach(actionItem => {
      if (actionItem.name === this.itemLoading) {
        actionItem.loading = true
      }
      const originOnClick = actionItem.onClick
      actionItem.onClick = () => {
        this.closeCardMenu()
        originOnClick()
      }
    })
    let items = [...actions]

    if (submissionBox) {
      items.unshift({
        name: 'Sub. Box Settings',
        iconRight: <SubmissionBoxIconSm />,
        onClick: this.openSubmissionBoxSettings,
      })
    }
    if (canEdit && !card.isPinnedAndLocked) {
      // Replace action is added later if this.props.canReplace
      items = _.reject(items, { name: 'Replace' })
      if (!card.can_move) {
        items = _.reject(items, { name: 'Move' })
      }
      if (record && record.is_submission_box_template) {
        items = _.reject(items, { name: 'Delete' })
        items = _.reject(items, { name: 'Move' })
      }
    } else {
      const viewActions = ['Link', 'Add to My Collection', 'Download']
      if (canView) {
        viewActions.unshift('Duplicate')
      }
      if (location !== 'Search' && !record.isCommonViewable) {
        viewActions.push('Tags')
        viewActions.push('Sharing')
      }
      items = _.filter(items, a => _.includes(viewActions, a.name))
    }

    // if record is system required, we always remove these actions
    if (record && record.system_required) {
      items = _.reject(items, { name: 'Duplicate' })
      items = _.reject(items, { name: 'Tags' })
      if (!card.link) {
        items = _.reject(items, { name: 'Delete' })
      }
    }

    if (uiStore.viewingCollection) {
      const coll = uiStore.viewingCollection
      // Remove Add To My Collection menu item for special collections
      if (coll.isUserCollection) {
        items = _.reject(items, { name: 'Add to My Collection' })
      }
    }

    if (!record || !record.isDownloadable) {
      items = _.reject(items, { name: 'Download' })
    }

    if (canReplace) {
      items.push(_.find(actions, { name: 'Replace' }))
    }

    // last special case for test collection card
    if (testCollectionCard) {
      return _.filter(actions, { name: 'Replace' })
    }

    return items
  }

  get buttonStyle() {
    const { location } = this.props
    return location === 'GridCard' || location === 'Search' ? 'card' : ''
  }

  render() {
    const {
      className,
      menuOpen,
      wrapperClassName,
      direction,
      uiStore,
    } = this.props
    return (
      <PopoutMenu
        className={className}
        wrapperClassName={wrapperClassName}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.toggleOpen}
        menuItems={this.menuItems}
        menuOpen={menuOpen}
        buttonStyle={this.buttonStyle}
        position={{ x: uiStore.cardMenuOpen.x, y: uiStore.cardMenuOpen.y }}
        direction={direction}
        width={250}
      />
    )
  }
}

ActionMenu.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  className: PropTypes.string,
  direction: PopoutMenu.propTypes.direction,
  wrapperClassName: PropTypes.string,
  location: PropTypes.string.isRequired,
  menuOpen: PropTypes.bool.isRequired,
  canView: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canReplace: PropTypes.bool,
  submissionBox: PropTypes.bool,
  onOpen: PropTypes.func.isRequired,
  onLeave: PropTypes.func.isRequired,
  onMoveMenu: PropTypes.func,
  afterArchive: PropTypes.func,
  testCollectionCard: PropTypes.bool,
}
ActionMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
ActionMenu.displayName = 'ActionMenu'

ActionMenu.defaultProps = {
  className: '',
  direction: null,
  wrapperClassName: 'card-menu',
  onMoveMenu: null,
  afterArchive: null,
  canReplace: false,
  submissionBox: false,
  testCollectionCard: false,
}

export default ActionMenu
