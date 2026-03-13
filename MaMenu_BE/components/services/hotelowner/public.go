package hotelowner

import (
	"net/http"

	"mamenu/models"
	"mamenu/pkg/logger"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type publicMenuResponse struct {
	Hotel      *models.Hotel              `json:"hotel"`
	Categories []*models.CategoryMenuNode `json:"categories"`
	Tables     []*models.Table            `json:"tables"`
}

func (h *hotelowner) GetPublicMenu() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelIDStr := ctx.Param("hotel_id")
		hotelID, err := primitive.ObjectIDFromHex(hotelIDStr)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid hotel_id"})
			return
		}

		hotel, err := h.database.GetHotelByID(hotelID)
		if err != nil {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "hotel not found"})
			return
		}
		if !hotel.IsActive {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "hotel not found"})
			return
		}

		cats, err := h.database.GetCategoriesByHotel(hotelID)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "public menu: get categories failed: "+err.Error())
			cats = []*models.Category{}
		}

		items, err := h.database.GetMenuItemsByHotel(bson.M{"hotel_id": hotelID, "is_available": true})
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "public menu: get items failed: "+err.Error())
			items = []*models.MenuItem{}
		}

		tables, err := h.database.GetTablesByHotel(hotelID)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "public menu: get tables failed: "+err.Error())
			tables = []*models.Table{}
		}

		ctx.JSON(http.StatusOK, publicMenuResponse{
			Hotel:      hotel,
			Categories: buildMenuTree(cats, items),
			Tables:     tables,
		})
	}
}

// buildMenuTree builds a nested category tree with items attached to each leaf/node.
// Always returns a non-nil slice so JSON encodes as [] not null.
func buildMenuTree(cats []*models.Category, items []*models.MenuItem) []*models.CategoryMenuNode {
	roots := make([]*models.CategoryMenuNode, 0)
	if len(cats) == 0 {
		return roots
	}

	// index categories
	index := make(map[primitive.ObjectID]*models.CategoryMenuNode, len(cats))
	for _, c := range cats {
		node := &models.CategoryMenuNode{Category: *c}
		index[c.ID] = node
	}

	// attach items to their category node
	for _, item := range items {
		if node, ok := index[item.CategoryID]; ok {
			node.Items = append(node.Items, item)
		}
	}

	// build tree — roots have no parent, children attach to parent
	for _, node := range index {
		if node.ParentID == nil {
			roots = append(roots, node)
		} else if parent, ok := index[*node.ParentID]; ok {
			parent.Children = append(parent.Children, node)
		} else {
			// parent was deleted/inactive — promote to root
			roots = append(roots, node)
		}
	}

	return roots
}
