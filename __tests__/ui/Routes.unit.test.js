import Routes from '~/ui/Routes'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import {
  fakeUser
} from '#/mocks/data'

let props, wrapper, requestResult, apiStore, uiStore, history
beforeEach(() => {
  requestResult = { data: fakeUser }
  history = {}
  apiStore = fakeApiStore({
    requestResult
  })
  uiStore = fakeUiStore
  props = { apiStore, uiStore, history }
})

describe('Routes', () => {
  describe('with terms accepted', () => {
    beforeEach(() => {
      props.apiStore.currentUser.terms_accepted = true
      wrapper = shallow(
        <Routes.wrappedComponent {...props} />
      )
    })
    it('makes an API call to fetch the user', () => {
      expect(apiStore.request).toBeCalledWith('users/me')
      expect(apiStore.setCurrentUserId).toHaveBeenCalledWith(requestResult.data.id)
    })

    it('does not blur the content if terms have been accepted', () => {
      expect(wrapper.find('AppWrapper').props().blur).toBeFalsy()
    })
    it('does not display the TermsOfUseModal', () => {
      expect(wrapper.find('TermsOfUseModal').exists()).toBeFalsy()
    })
  })

  describe('with terms not yet accepted', () => {
    beforeEach(() => {
      requestResult = { data: { ...fakeUser, terms_accepted: false } }
      props.apiStore.request = jest.fn().mockReturnValue(Promise.resolve(requestResult))
      props.apiStore.currentUser.terms_accepted = false
      wrapper = shallow(
        <Routes.wrappedComponent {...props} />
      )
    })
    it('blurs the content if terms have not been accepted', () => {
      expect(uiStore.update).toHaveBeenCalledWith('blurContent', true)
    })
    it('displays the TermsOfUseModal', () => {
      expect(wrapper.find('TermsOfUseModal').exists()).toBeTruthy()
    })
  })
})
