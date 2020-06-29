import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Popover, Grid } from '@material-ui/core'

import v from '~/utils/variables'
import TextButton from '~/ui/global/TextButton'

const ButtonsWrapper = styled.div`
  padding: 20px 30px 15px 30px;
`

class InlineModal extends React.PureComponent {
  handleCancel = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const { onCancel } = this.props
    onCancel && onCancel()
  }

  handleConfirm = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const { onConfirm } = this.props
    onConfirm && onConfirm()
  }

  get popoverProps() {
    const { anchorElement, open, anchorOrigin } = this.props
    const popProps = {
      anchorOrigin,
      open,
      onClose: this.handleCancel,
    }
    if (anchorElement) {
      popProps.anchorEl = anchorElement
      popProps.anchorReference = 'anchorEl'
    }
    return popProps
  }

  render() {
    const { children, leftButton, hideButtons } = this.props
    return (
      <Popover {...this.popoverProps}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            {children}
          </Grid>
        </Grid>
        {!hideButtons && (
          <ButtonsWrapper>
            <Grid container spacing={0}>
              <Grid item xs={4}>
                {leftButton}
              </Grid>
              <Grid item xs={8} style={{ textAlign: 'right' }}>
                <TextButton
                  onClick={this.handleCancel}
                  fontSizeEm={0.75}
                  color={v.colors.black}
                  style={{ marginRight: '2em' }}
                  className="cancel-button"
                >
                  Cancel
                </TextButton>
                <TextButton
                  onClick={this.handleConfirm}
                  fontSizeEm={0.75}
                  color={v.colors.black}
                  className="ok-button"
                >
                  OK
                </TextButton>
              </Grid>
            </Grid>
          </ButtonsWrapper>
        )}
      </Popover>
    )
  }
}

InlineModal.propTypes = {
  open: PropTypes.bool.isRequired,
  children: PropTypes.node,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  leftButton: PropTypes.node,
  anchorElement: PropTypes.node,
  hideButtons: PropTypes.bool,
  anchorOrigin: PropTypes.shape({
    horizontal: PropTypes.string,
    vertical: PropTypes.string,
  }),
}

InlineModal.defaultProps = {
  children: null,
  onConfirm: null,
  onCancel: null,
  leftButton: null,
  anchorElement: null,
  hideButtons: false,
  anchorOrigin: { horizontal: 'center', vertical: 'center' },
}

export default InlineModal
