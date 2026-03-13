package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserRole string

const (
	RoleSuperAdmin UserRole = "super_admin"
	RoleHotelAdmin UserRole = "hotel_admin"
)

type User struct {
	ID       primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Name     string               `bson:"name" json:"name"`
	Email    string               `bson:"email" json:"email"`
	Phone    string               `bson:"phone" json:"phone"`
	Password string               `bson:"password" json:"-"`
	Role     UserRole             `bson:"role" json:"role"`
	HotelIDs []primitive.ObjectID `bson:"hotel_ids,omitempty" json:"hotel_ids,omitempty"`
	IsActive bool                 `bson:"is_active" json:"is_active"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}
