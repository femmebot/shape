import ChartItemCover from '~/ui/grid/covers/ChartItemCover'
import { apiStore } from '~/stores'

import { fakeChartItem } from '#/mocks/data'

jest.mock('../../../../app/javascript/stores')

let props, wrapper, rerender, component

describe('ChartItemCover', () => {
  beforeEach(() => {
    props = {
      item: fakeChartItem,
    }
    rerender = () => {
      wrapper = shallow(<ChartItemCover {...props} />)
      component = wrapper.instance()
    }
    rerender()
  })

  describe('render()', () => {
    it('does not render headings when the question is not there', () => {
      expect(wrapper.find('Heading1').exists()).toBe(false)
      expect(wrapper.find('Heading3').exists()).toBe(false)
    })

    describe('when question is fetched', () => {
      beforeEach(() => {
        apiStore.fetch.mockReturnValue(
          Promise.resolve({
            data: {
              question_type: 'question_useful',
            },
          })
        )
        rerender()
      })

      it('does render the headings when the question is there', async () => {
        // TODO not working yet
        // expect(wrapper.find('Heading1').text()).toEqual('')
        // expect(wrapper.find('Heading3').text()).toEqual('')
      })
    })

    it('renders a victory bar chart with formatted data', () => {
      expect(
        wrapper
          .find('VictoryBar')
          .first()
          .props().data
      ).toEqual(component.formattedData.datasets[0].data)
    })
  })

  describe('formattedData', () => {
    it('formats the data into an array as percentages of totals', () => {
      expect(component.formattedData).toEqual({
        datasets: [
          {
            data: [
              {
                answer: 1,
                num_responses: 2,
                percentage: 28,
                total: 7,
                type: 'question_items',
              },
              {
                answer: 2,
                num_responses: 2,
                percentage: 28,
                total: 7,
                type: 'question_items',
              },
              {
                answer: 3,
                num_responses: 0,
                percentage: 0,
                total: 7,
                type: 'question_items',
              },
              {
                answer: 4,
                num_responses: 3,
                percentage: 42,
                total: 7,
                type: 'question_items',
              },
            ],
            label: 'Super test',
            total: 7,
            type: 'question_items',
          },
          {
            data: [
              {
                answer: 1,
                num_responses: 5,
                percentage: 10,
                total: 50,
                type: 'org_wide',
              },
              {
                answer: 2,
                num_responses: 10,
                percentage: 20,
                total: 50,
                type: 'org_wide',
              },
              {
                answer: 3,
                num_responses: 20,
                percentage: 40,
                total: 50,
                type: 'org_wide',
              },
              {
                answer: 4,
                num_responses: 15,
                percentage: 30,
                total: 50,
                type: 'org_wide',
              },
            ],
            label: 'Super Org',
            total: 50,
            type: 'org_wide',
          },
        ],
      })
    })
  })

  describe('fetchQuestionItem()', () => {
    it('fetches the question item', () => {
      expect(apiStore.fetch).toHaveBeenCalledWith('items', 3)
    })
  })
})
