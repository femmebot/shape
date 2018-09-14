import { Collection } from 'datx'
import { jsonapi } from 'datx-jsonapi'
import { first } from 'lodash'

import * as networkModels from '~shared/api.network.v1'

class NetworkStore extends jsonapi(Collection) {
  static types = Object.keys(networkModels).filter(x => x.type)

  loadOrganization(external_id) {
    return this
      .fetchAll('organizations', {
        filter: {external_id}
      }).then(response => first(response.data))
  }

  loadPaymentMethods(organization_id) {
    return this
      .fetchAll('payment_methods', {
        sort: '-default,exp_year,exp_month',
        filter: {organization_id},
      }).then(response => response.data)
  createPaymentMethod(organization, token) {
    const {card} = token
    if (!card) {
      throw new Error('Missing card')
    }
    if (!card.name) {
      throw new Error('Missing card name')
    }
    if (!card.address_zip) {
      throw new Error('Missing card address zip')
    }

    const paymentMethod = new networkModels.CreatePaymentMethod(
      token.id,
      card.name,
      card.exp_month,
      card.exp_year,
      card.address_zip,
      card.country,
      false
    )
    paymentMethod.organization_id = organization.id
    return saveModel(paymentMethod).then(() => this.add(paymentMethod))
  }
}

export default NetworkStore
