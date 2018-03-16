require 'rails_helper'

describe Api::V1::GroupsController, type: :request, auth: true do
  let(:user) { @user }

  describe 'GET #show' do
    let!(:group) { create(:group, admin: user) }
    let(:path) { "/api/v1/groups/#{group.id}" }
    let(:users_json) { json_included_objects_of_type('users') }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('group')
    end

    it 'includes admin' do
      admin_json = json['data']['relationships']['admins']['data'].first
      expect(admin_json).to match_json_schema('user')
      expect(admin_json['id']).to eq(user.id)
    end

    context 'with member' do
      let!(:member) { create(:user) }

      before do
        editor.add_role(Role::MEMBER, group)
      end

      it 'includes editors' do
        get(path)
        expect(json['data']['relationships']['members']['data'][0]['id'].to_i).to eq(member.id)
      end
    end
  end

  describe 'POST #create' do
    let(:path) { '/api/v1/groups' }
    let(:params) do
      json_api_params(
        'groups',
        {
          name: 'Creative Collaborators',
          tag: 'collaborators',
        }
      )
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      post(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('group')
    end
  end

  describe 'PATCH #update' do
    let!(:group) { create(:group) }
    let(:path) { "/api/v1/groups/#{group.id}" }
    let(:params) do
      json_api_params(
        'groups',
        {
          name: 'Creative Competitors',
        }
      )
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('group')
    end

    it 'updates the content' do
      expect(group.name).not_to eq('Creative Competitors')
      patch(path, params: params)
      expect(group.reload.name).to eq('Creative Competitors')
    end
  end
end
