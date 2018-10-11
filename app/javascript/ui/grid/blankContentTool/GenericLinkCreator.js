import PropTypes from 'prop-types'

import { BctTextField, FormButton } from '~/ui/global/styled/forms'
import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
import { KEYS } from '~/utils/variables'
import ValidIndicator from './ValidIndicator'

// NOTE: This component used to be shared between LinkCreator and VideoCreator
// but now those have merged into one.
const GenericLinkCreator = ({
  url,
  urlValid,
  loading,
  placeholder,
  onSubmit,
  onChange,
  onClose,
}) => {
  let validIndicator = ''
  if (url.length > 3) {
    validIndicator = <ValidIndicator valid={!!urlValid} loading={loading} />
  }

  const handleKeyDown = e => {
    if (e.keyCode === KEYS.ESC) {
      onClose()
    }
  }

  return (
    <PaddedCardCover>
      <form className="form" onSubmit={onSubmit}>
        <BctTextField
          data-cy="BctTextField"
          autoFocus
          placeholder={placeholder}
          value={url}
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
        {validIndicator}
        <FormButton disabled={loading} data-cy="LinkCreatorFormButton">
          Add
        </FormButton>
      </form>
    </PaddedCardCover>
  )
}

GenericLinkCreator.propTypes = {
  url: PropTypes.string.isRequired,
  urlValid: PropTypes.bool.isRequired,
  placeholder: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
}

export default GenericLinkCreator
