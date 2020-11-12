import adapter from 'mobx-rest-jquery-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'
import baseUrl from '../utils/baseUrl'

apiClient(adapter, {
  apiPath: baseUrl(''),
})

class BusinessUnitModel extends Model {
  url() {
    // Do this conditionally because otherwise it tries to use the /:id for creating
    return this.id && !this.isNew
      ? `/api/v1/creative_difference/groups/${this.id}`
      : `/api/v1/creative_difference/groups`
  }
}

class BusinessUnitsCollection extends Collection {
  // use .rpc({ endpoint: /api/v3/users/me }) for non-rest calls
  url() {
    return `/api/v1/creative_difference/proxy?url=business_units`
    // need to handle organization id
  }
  model() {
    return BusinessUnitModel
  }
}

// singleton
export default new BusinessUnitsCollection()