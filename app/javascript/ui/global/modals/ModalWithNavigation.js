import React from 'react'
import PropTypes from 'prop-types'

import { Heading3 } from '~/ui/global/styled/typography'
import Modal from '~/ui/global/modals/Modal'
import styled from 'styled-components'
import v from '~/utils/variables'
import InlineLoader from '~/ui/layout/InlineLoader'

const NavigationContainer = styled.div`
  display: flex;

  &:last-child {
    margin-right: 0;
  }
`

const NavElement = styled(Heading3)`
  cursor: pointer;
  font-size: 13px;
  margin-right: 45px;
  ${props =>
    props.isActive &&
    `
    text-decoration: underline;
  `}

  &:hover {
    color: ${v.colors.commonDarkest};
  }
`
/**
 * A modal where you can pass in navigation elements and it will render a tab
 * navigation in the header section of the modal
 *
 * @component
 */
class ModalWithNavigation extends React.Component {
  state = {
    currentPage: null,
  }

  constructor(props) {
    super(props)
    this.state.currentPage = props.contents[0].name
  }

  isActive(element) {
    return this.state.currentPage === element.name
  }

  handleNavClick = pageName => {
    this.setState({ currentPage: pageName })
  }

  get currentContents() {
    const { contents } = this.props
    const { currentPage } = this.state
    return contents.find(page => page.name === currentPage)
  }

  render() {
    const { title, contents, open, onClose, showLoader } = this.props
    return (
      <Modal title={title} open={open} onClose={onClose} scrollVisible>
        <NavigationContainer>
          {contents.map(element => (
            <NavElement
              onClick={() => this.handleNavClick(element.name)}
              isActive={this.isActive(element)}
              key={element.name}
              data-cy={element.dataCy}
            >
              {element.name}
            </NavElement>
          ))}
        </NavigationContainer>
        {showLoader && <InlineLoader />}
        {this.currentContents.component}
      </Modal>
    )
  }
}
ModalWithNavigation.propTypes = {
  /** The title of the modal, that appears as a header at the top */
  title: PropTypes.node.isRequired,
  /**
   * The navigation and contents of each navigation tab in the modal.
   */
  contents: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      component: PropTypes.node,
    })
  ).isRequired,
  /**
   * The state for when the modal should be open, must be set to true to display
   * the modal
   */
  open: PropTypes.bool,
  /** The close handler for when user closes the modal with the close button */
  onClose: PropTypes.func,
  /** Pass true if you want to show loading indicator **/
  showLoader: PropTypes.bool,
}

ModalWithNavigation.defaultProps = {
  open: false,
  onClose: () => null,
  showLoader: false,
}

export default ModalWithNavigation
