require 'rails_helper'

describe HomeController, type: :request do
  before do
    # NOTE: not doing any normal rendering of the index page because we defer to Cypress for those,
    # and they make for slow request specs
    allow_any_instance_of(HomeController).to receive(:render).and_return 'rendered.'
  end

  describe 'GET #index' do
    let(:path) { '/' }

    context 'with a limited user' do
      let(:limited_user) { create(:user, status: :limited) }
      before do
        log_in_as_user(limited_user)
      end
      it 'redirects if you are signed in as a limited user' do
        expect(get(path)).to redirect_to(root_url)
      end
    end
  end

  describe 'GET #login' do
    context 'with redirect param' do
      let(:redirect) { 'http://www.shape.space/redirectpath' }
      let(:path) { "/login?redirect=#{redirect}" }

      before do
        allow_any_instance_of(HomeController).to receive(:store_location_for).and_wrap_original do |m, *args|
          m.call(args[1], args[2])
        end
      end

      it 'remembers where to redirect the user' do
        expect_any_instance_of(HomeController).to receive(:store_location_for).with(
          :user, redirect
        )
        get(path)
      end
    end
  end
end