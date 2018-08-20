import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import PageError from '~/ui/global/PageError'
import PageWithApi from '~/ui/pages/PageWithApi'
import Loader from '~/ui/layout/Loader'
import PageContainer from '~/ui/layout/PageContainer'
import CollectionGrid from '~/ui/grid/CollectionGrid'
import MoveModal from '~/ui/grid/MoveModal'
import PageHeader from '~/ui/pages/shared/PageHeader'
import ChannelManager from '~/utils/ChannelManager'

const isHomepage = ({ params }) => (params.org && !params.id)

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class CollectionPage extends PageWithApi {
  componentWillMount() {
    this.subscribeToChannel(this.props.match.params.id)
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps)
    // when navigating between collections, close BCT
    const previousId = this.props.match.params.id
    const currentId = nextProps.match.params.id
    if (currentId !== previousId) {
      ChannelManager.unsubscribeAllFromChannel(this.channelName)
      this.subscribeToChannel(currentId)
      this.props.uiStore.closeBlankContentTool()
    }
  }

  subscribeToChannel(id) {
    ChannelManager.subscribe(this.channelName, id,
      {
        channelConnected: () => { console.log('conn', arguments) },
        channelReceivedData: this.receivedChannelData,
        channelDisconnected: () => { console.log('dscn', arguments) },
        channelRejected: () => { console.log('rjct', arguments) },
      })
    console.log(ChannelManager.channels)
  }

  receivedChannelData = async (data) => {
    const { apiStore } = this.props
    const currentId = this.props.match.params.id
    apiStore.request(this.requestPath(this.props))
  }

  get channelName() {
    return 'CollectionViewingChannel'
  }

  get isHomepage() {
    return isHomepage(this.props.match)
  }

  get collection() {
    const { match, apiStore } = this.props
    if (!apiStore.collections.length) return null
    if (this.isHomepage) {
      return apiStore.find('collections', apiStore.currentUser.current_user_collection_id)
    }
    return apiStore.find('collections', match.params.id)
  }

  get roles() {
    const { apiStore, match } = this.props
    return apiStore.findAll('roles').filter((role) =>
      role.resource && role.resource.id === parseInt(match.params.id))
  }

  requestPath = (props) => {
    const { match, apiStore } = props
    if (isHomepage(match)) {
      return `collections/${apiStore.currentUser.current_user_collection_id}`
    }
    return `collections/${match.params.id}`
  }

  onAPILoad = async (response) => {
    this.updateError(null)
    const collection = response.data
    const { apiStore, uiStore, location } = this.props
    uiStore.setViewingCollection(collection)
    // setViewingCollection has to happen first bc we use it in openBlankContentTool
    if (!collection.collection_cards.length) {
      uiStore.openBlankContentTool()
    }
    collection.checkCurrentOrg()
    if (collection.isNormalCollection) {
      const thread = await apiStore.findOrBuildCommentThread(collection)
      if (location.search) {
        const menu = uiStore.openOptionalMenus(location.search)
        if (menu === 'comments') {
          uiStore.expandThread(thread.key)
        }
      }
    } else {
      apiStore.clearUnpersistedThreads()
    }
  }

  updateCollection = () => {
    // TODO: what if there's no collection?
    // calling .save() will receive any API updates and sync them
    this.collection.API_updateCards()
    const { uiStore } = this.props
    uiStore.trackEvent('update', this.collection)
  }

  updateCollectionName = (name) => {
    this.collection.name = name
    this.collection.save()
    const { uiStore } = this.props
    uiStore.trackEvent('update', this.collection)
  }

  render() {
    // this.error comes from PageWithApi
    if (this.error) return <PageError error={this.error} />

    const { collection } = this
    const { uiStore } = this.props
    if (!collection || collection.can_edit === undefined) return <Loader />
    const { movingCardIds, cardAction } = uiStore
    // only tell the Grid to hide "movingCards" if we're moving and not linking
    const uiMovingCardIds = cardAction === 'move' ? movingCardIds : []
    // SharedCollection has special behavior where it sorts by most recently updated
    const sortBy = collection.isSharedCollection ? 'updated_at' : 'order'

    return (
      <Fragment>
        <PageHeader
          record={collection}
          isHomepage={this.isHomepage}
        />
        <PageContainer>
          <CollectionGrid
            // pull in cols, gridW, gridH, gutter
            {...uiStore.gridSettings}
            gridSettings={uiStore.gridSettings}
            updateCollection={this.updateCollection}
            collection={collection}
            canEditCollection={collection.can_edit_content}
            // Pass in cardIds so grid will re-render when they change
            cardIds={collection.cardIds}
            // Pass in BCT state so grid will re-render when open/closed
            blankContentToolState={uiStore.blankContentToolState}
            movingCardIds={uiMovingCardIds}
            // passing length prop seems to properly trigger a re-render
            movingCards={uiStore.movingCardIds.length}
            sortBy={sortBy}
          />
          <MoveModal />
        </PageContainer>
      </Fragment>
    )
  }
}

CollectionPage.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
  location: ReactRouterPropTypes.location.isRequired,
}
CollectionPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionPage
