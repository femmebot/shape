import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import ReactPlayer from 'react-player'

const StyledVideoItem = styled.div`
  /* arbitrary styles for now */
  width: 800px;
  height: 600px;
  > div {
    height: 100%;
  }
`
StyledVideoItem.displayName = 'StyledVideoItem'

class VideoItem extends React.Component {
  render() {
    const { item } = this.props
    const videoUrl = item.url

    // ReactPlayer can play most external video server URLs
    // Examples: https://github.com/CookPete/react-player/blob/master/src/demo/App.js
    return (
      <StyledVideoItem>
        <ReactPlayer
          url={videoUrl}
          playing={false}
          controls={false}
          width="800"
          height="600"
        />
      </StyledVideoItem>
    )
  }
}

VideoItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default VideoItem
