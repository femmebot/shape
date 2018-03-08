import _ from 'lodash'

import RolesSummary from '~/ui/layout/RolesSummary'

import {
  fakeUser,
} from '#/mocks/data'

const emptyProps = {
  editors: [],
  viewers: [],
  handleClick: jest.fn()
}

const editorsAndViewersProps = {
  editors: [fakeUser, fakeUser],
  viewers: [fakeUser, fakeUser],
  handleClick: jest.fn()
}

const tooManyEditorsProps = _.merge({}, editorsAndViewersProps, {
  editors: [fakeUser, fakeUser, fakeUser, fakeUser, fakeUser, fakeUser]
})

const onlyViewersProps = _.merge({}, emptyProps, { viewers: [fakeUser, fakeUser] })

const onlyEditorsProps = _.merge({}, emptyProps, { editors: [fakeUser, fakeUser] })

let wrapper
describe('RolesSummary', () => {
  describe('with editors and viewers', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...editorsAndViewersProps} />
      )
    })

    it('renders editors', () => {
      expect(wrapper.find('StyledRoleTitle').at(0).children().text()).toMatch(/editors/i)
      expect(wrapper.find('[className="editor"]').length).toEqual(2)
    })

    it('renders viewers', () => {
      expect(wrapper.find('StyledRoleTitle').at(1).children().text()).toMatch(/viewers/i)
      expect(wrapper.find('[className="viewer"]').length).toEqual(2)
    })

    it('renders manage roles button with onClick', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
      expect(wrapper.find('StyledAddUserBtn').props().onClick).toEqual(editorsAndViewersProps.handleClick)
    })
  })

  describe('with only viewers', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...onlyViewersProps} />
      )
    })

    it('renders 2 viewers and label', () => {
      expect(wrapper.find('[className="viewer"]').length).toEqual(2)
      expect(wrapper.find('StyledRoleTitle').at(0).children().text()).toMatch(/viewers/i)
    })

    it('does not render editors label', () => {
      expect(wrapper.find('StyledRoleTitle').length).toEqual(1)
    })

    it('renders manage roles button', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
    })
  })

  describe('with only editors', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...onlyEditorsProps} />
      )
    })

    it('renders 2 editors and label', () => {
      expect(wrapper.find('[className="editor"]').length).toEqual(2)
      expect(wrapper.find('StyledRoleTitle').at(0).children().text()).toMatch(/editors/i)
    })

    it('does not render viewers', () => {
      expect(wrapper.find('StyledRoleTitle').length).toEqual(1)
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
    })

    it('renders manage roles button', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
    })
  })

  describe('with more editors than should show', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...tooManyEditorsProps} />
      )
    })

    it('renders only 5 editors', () => {
      expect(wrapper.find('[className="editor"]').length).toEqual(5)
    })

    it('does not render any viewers', () => {
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
    })
  })

  describe('with no viewers or editors', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...emptyProps} />
      )
    })

    it('renders editor label', () => {
      expect(wrapper.find('StyledRoleTitle').at(0).children().text()).toMatch(/editors/i)
    })

    it('does not render editors or viewers', () => {
      expect(wrapper.find('[className="editor"]').exists()).toBe(false)
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
    })

    it('renders manage roles button', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
    })
  })
})
