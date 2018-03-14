import { observable, action } from 'mobx'

export default class UiStore {
  @observable blankContentToolState = null
  @observable openCardMenuId = false
  @observable organizationMenuOpen = false
  @observable gridSettings = {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  }
  @observable isLoading = false

  @action openBlankContentTool({ order = 0 } = {}) {
    this.blankContentToolState = { order }
  }

  @action closeBlankContentTool() {
    this.blankContentToolState = null
  }

  @action openCardMenu(cardId) {
    this.openCardMenuId = cardId
  }

  @action openOrganizationMenu() {
    if (!this.organizationMenuOpen) {
      this.organizationMenuOpen = true
    }
  }

  @action loading(val) {
    this.isLoading = val
  }

  @action closeOrganizationMenu() {
    if (this.organizationMenuOpen) {
      this.organizationMenuOpen = false
    }
  }
}
