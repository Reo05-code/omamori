Rails.application.routes.draw do
  # Root path for Render health check
  root to: proc { [200, {}, ['OK']] }
  # Health check endpoint
  get "health", to: "health#index"

  # API routes
  # namespace :api do
  #   namespace :v1 do
  #     # Add your API endpoints here
  #   end
  # end
end
