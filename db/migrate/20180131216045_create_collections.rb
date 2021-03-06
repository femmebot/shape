class CreateCollections < ActiveRecord::Migration[5.1]
  def change
    create_table :collections do |t|
      t.string :name, :type
      t.references :organization, foreign_key: true
      t.references :cloned_from, references: :collections

      t.timestamps
    end
  end
end
