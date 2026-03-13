package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Category struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	HotelID   primitive.ObjectID  `bson:"hotel_id" json:"hotel_id"`
	Name      string              `bson:"name" json:"name"`
	Type      string              `bson:"type" json:"type"` // e.g. "veg", "non-veg", "beverage", custom
	ParentID  *primitive.ObjectID `bson:"parent_id,omitempty" json:"parent_id,omitempty"`
	SortOrder int                 `bson:"sort_order" json:"sort_order"`
	IsActive  bool                `bson:"is_active" json:"is_active"`
	CreatedAt time.Time           `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time           `bson:"updated_at" json:"updated_at"`
}

// CategoryTree is used in GET categories response (nested hierarchy)
type CategoryTree struct {
	Category
	Children []*CategoryTree `json:"children,omitempty"`
}

// CategoryMenuNode is used in the public menu — includes items attached to the category
type CategoryMenuNode struct {
	Category
	Children []*CategoryMenuNode `json:"children,omitempty"`
	Items    []*MenuItem         `json:"items,omitempty"`
}
