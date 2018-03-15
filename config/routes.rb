Rails.application.routes.draw do
  devise_for :users, controllers: { omniauth_callbacks: 'users/omniauth_callbacks' }

  namespace :api do
    namespace :v1 do
      resources :collections do
        collection do
          get 'me'
        end
        member do
          post 'duplicate'
        end
        resources :collection_cards, only: :index
      end
      resources :collection_cards, shallow: true do
        member do
          post 'duplicate'
        end
        resources :items, shallow: true, except: :index do
          member do
            post 'duplicate'
          end
        end
        resources :collections, only: :create
        member do
          patch 'archive'
        end
      end
      resources :organizations, only: [:show, :update] do
        collection do
          get 'current'
        end
        resources :collections, only: [:index, :create]
      end
      resources :users do
        collection do
          get 'me'
          get 'search'
        end
      end

      get :search, to: 'search#search', as: :search
    end
  end

  root to: 'home#index'
  get :login, to: 'home#login', as: :login

  # catch all HTML route requests, send to frontend
  get '*path', to: 'home#index', constraints: ->(req) { req.format == :html || req.format == '*/*' }
end
