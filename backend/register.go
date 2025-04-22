package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	collection     *mongo.Collection
	logsCollection *mongo.Collection
)

type Usuario struct {
	Nombres    string `json:"nombres"`
	Apellidos  string `json:"apellidos"`
	Cedula     string `json:"cedula"`
	Correo     string `json:"correo"`
	Telefono   string `json:"telefono"`
	Contrasena string `json:"contrasena"`
	Foto       string `json:"foto"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ Advertencia: No se pudo cargar el archivo .env:", err)
	}

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("❌ ERROR: La variable de entorno MONGO_URI no está definida")
	}

	clientOptions := options.Client().ApplyURI(mongoURI).
		SetTLSConfig(&tls.Config{
			MinVersion:         tls.VersionTLS12,
			InsecureSkipVerify: true,
		}).SetServerSelectionTimeout(10 * time.Second).
		SetConnectTimeout(10 * time.Second)

	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatal("❌ ERROR: No se pudo conectar a MongoDB:", err)
	}

	err = client.Ping(context.TODO(), nil)
	if err != nil {
		log.Fatal("❌ ERROR: No se pudo hacer ping a MongoDB:", err)
	}

	collection = client.Database("qrtixpro").Collection("usuarios")
	logsCollection = client.Database("qrtixpro").Collection("logs")
	log.Println("✅ Conexión exitosa a MongoDB Atlas")

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"POST", "GET", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.POST("/registro", registrarUsuario)
	r.POST("/login", iniciarSesion)
	r.POST("/obtener-usuario", obtenerUsuario)
	r.PUT("/actualizar-usuario", actualizarUsuario)
	r.DELETE("/eliminar-usuario", eliminarUsuario)
	r.POST("/verificar-correo", verificarCorreo)
	r.POST("/verificar-rostro", verificarRostro)
	r.PUT("/actualizar-ultima-sesion", actualizarUltimaSesion)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("🚀 Servidor corriendo en el puerto %s\n", port)
	r.Run(":" + port)
}

func registrarUsuario(c *gin.Context) {
	var usuario Usuario

	if err := c.ShouldBindJSON(&usuario); err != nil {
		log.Println("❌ ERROR: Datos JSON inválidos:", err)
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "mensaje": "Datos inválidos"})
		return
	}

	// Validar campos obligatorios
	errores := validarCamposUsuario(usuario)
	if len(errores) > 0 {
		log.Println("❌ ERROR: Validación fallida:", errores)
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "mensaje": "Datos inválidos", "errores": errores})
		return
	}

	// Verificar si ya existe un usuario con la misma cédula
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var usuarioExistente Usuario
	err := collection.FindOne(ctx, bson.M{"cedula": usuario.Cedula}).Decode(&usuarioExistente)
	if err == nil {
		log.Printf("❌ ERROR: Ya existe un usuario con la cédula %s", usuario.Cedula)
		c.JSON(http.StatusConflict, gin.H{"status": "error", "mensaje": "Ya existe un usuario con esta cédula"})
		return
	} else if err != mongo.ErrNoDocuments {
		log.Println("❌ ERROR: Error al verificar usuario existente:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "mensaje": "Error al verificar usuario existente"})
		return
	}

	// Verificar si ya existe un usuario con el mismo correo
	err = collection.FindOne(ctx, bson.M{"correo": usuario.Correo}).Decode(&usuarioExistente)
	if err == nil {
		log.Printf("❌ ERROR: Ya existe un usuario con el correo %s", usuario.Correo)
		c.JSON(http.StatusConflict, gin.H{"status": "error", "mensaje": "Ya existe un usuario con este correo electrónico"})
		return
	} else if err != mongo.ErrNoDocuments {
		log.Println("❌ ERROR: Error al verificar correo existente:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "mensaje": "Error al verificar correo existente"})
		return
	}

	// Insertar el nuevo usuario
	_, err = collection.InsertOne(ctx, bson.M{
		"nombres":    usuario.Nombres,
		"apellidos":  usuario.Apellidos,
		"cedula":     usuario.Cedula,
		"correo":     usuario.Correo,
		"telefono":   usuario.Telefono,
		"contrasena": usuario.Contrasena,
		"foto":       usuario.Foto,
	})

	if err != nil {
		log.Println("❌ ERROR: No se pudo insertar en MongoDB:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "mensaje": "Error al registrar usuario"})
		return
	}

	log.Println("✅ Usuario registrado con éxito:", usuario.Cedula)
	c.JSON(http.StatusOK, gin.H{"status": "success", "mensaje": "Usuario registrado con éxito"})
}

// Función para validar los campos del usuario
func validarCamposUsuario(usuario Usuario) map[string]string {
	errores := make(map[string]string)

	// Validar nombres
	if strings.TrimSpace(usuario.Nombres) == "" {
		errores["nombres"] = "El nombre es obligatorio"
	} else if !regexp.MustCompile(`^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$`).MatchString(usuario.Nombres) {
		errores["nombres"] = "El nombre solo debe contener letras"
	} else if len(usuario.Nombres) < 2 {
		errores["nombres"] = "El nombre debe tener al menos 2 caracteres"
	}

	// Validar apellidos
	if strings.TrimSpace(usuario.Apellidos) == "" {
		errores["apellidos"] = "El apellido es obligatorio"
	} else if !regexp.MustCompile(`^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$`).MatchString(usuario.Apellidos) {
		errores["apellidos"] = "El apellido solo debe contener letras"
	} else if len(usuario.Apellidos) < 2 {
		errores["apellidos"] = "El apellido debe tener al menos 2 caracteres"
	}

	// Validar cédula
	if strings.TrimSpace(usuario.Cedula) == "" {
		errores["cedula"] = "La cédula es obligatoria"
	} else if !regexp.MustCompile(`^\d+$`).MatchString(usuario.Cedula) {
		errores["cedula"] = "La cédula solo debe contener números"
	} else if len(usuario.Cedula) < 5 || len(usuario.Cedula) > 12 {
		errores["cedula"] = "La cédula debe tener entre 5 y 12 dígitos"
	}

	// Validar correo
	if strings.TrimSpace(usuario.Correo) == "" {
		errores["correo"] = "El correo electrónico es obligatorio"
	} else if !regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`).MatchString(usuario.Correo) {
		errores["correo"] = "Ingrese un correo electrónico válido"
	}

	// Validar teléfono
	if strings.TrimSpace(usuario.Telefono) == "" {
		errores["telefono"] = "El teléfono es obligatorio"
	} else if !regexp.MustCompile(`^\d+$`).MatchString(usuario.Telefono) {
		errores["telefono"] = "El teléfono solo debe contener números"
	} else if len(usuario.Telefono) < 7 || len(usuario.Telefono) > 15 {
		errores["telefono"] = "El teléfono debe tener entre 7 y 15 dígitos"
	}

	// Validar contraseña
	if usuario.Contrasena == "" {
		errores["contrasena"] = "La contraseña es obligatoria"
	} else if len(usuario.Contrasena) < 8 {
		errores["contrasena"] = "La contraseña debe tener al menos 8 caracteres"
	} else {
		tieneMinuscula := regexp.MustCompile(`[a-z]`).MatchString(usuario.Contrasena)
		tieneMayuscula := regexp.MustCompile(`[A-Z]`).MatchString(usuario.Contrasena)
		tieneNumero := regexp.MustCompile(`[0-9]`).MatchString(usuario.Contrasena)
		tieneEspecial := regexp.MustCompile(`[!@#$%^&*(),.?":{}|<>]`).MatchString(usuario.Contrasena)

		if !tieneMinuscula || !tieneMayuscula || !tieneNumero || !tieneEspecial {
			errores["contrasena"] = "La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial"
		}
	}

	// Validar foto
	if strings.TrimSpace(usuario.Foto) == "" {
		errores["foto"] = "La foto es obligatoria"
	}

	return errores
}

func iniciarSesion(c *gin.Context) {
	var datosLogin struct {
		Cedula     string `json:"cedula"`
		Contrasena string `json:"contrasena"`
		Foto       string `json:"foto"`
	}

	if err := c.ShouldBindJSON(&datosLogin); err != nil {
		log.Println("❌ ERROR: Datos JSON inválidos:", err)
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Datos inválidos"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var usuario Usuario
	err := collection.FindOne(ctx, bson.M{"cedula": datosLogin.Cedula}).Decode(&usuario)
	if err != nil {
		log.Printf("❌ ERROR: Usuario no encontrado para cédula %s: %v", datosLogin.Cedula, err)
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Cédula o contraseña incorrecta"})
		return
	}

	if datosLogin.Contrasena != usuario.Contrasena {
		log.Printf("❌ ERROR: Contraseña incorrecta para cédula %s", datosLogin.Cedula)
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Cédula o contraseña incorrecta"})
		return
	}

	if !compararImagenes(usuario.Foto, datosLogin.Foto) {
		log.Printf("❌ ERROR: Verificación facial fallida para cédula %s", datosLogin.Cedula)
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Verificación facial fallida"})
		return
	}

	// Registrar el log de inicio de sesión
	colombiaLoc, _ := time.LoadLocation("America/Bogota")
	tiempoColombia := time.Now().In(colombiaLoc)
	formatoFecha := tiempoColombia.Format("2006-01-02 15:04:05")

	logData := bson.M{
		"cedula":     datosLogin.Cedula,
		"fecha_hora": formatoFecha,
	}

	_, err = logsCollection.InsertOne(ctx, logData)
	if err != nil {
		log.Printf("⚠️ Advertencia: No se pudo registrar el log de inicio de sesión: %v", err)
	}

	log.Printf("✅ Inicio de sesión exitoso para cédula %s", datosLogin.Cedula)
	c.JSON(http.StatusOK, gin.H{"success": true, "mensaje": "Inicio de sesión exitoso"})
}

func obtenerUsuario(c *gin.Context) {
	var datos struct {
		Cedula string `json:"cedula"`
	}

	if err := c.ShouldBindJSON(&datos); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "mensaje": "Por favor, ingrese una cédula válida"})
		log.Println("❌ ERROR: Datos JSON inválidos:", err)
		return
	}

	if datos.Cedula == "" {
		log.Println("❌ ERROR: Cédula vacía")
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "mensaje": "La cédula no puede estar vacía"})
		return
	}

	log.Printf("🔍 Buscando usuario con cédula: %s", datos.Cedula)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var usuario Usuario
	filter := bson.M{"cedula": datos.Cedula}

	err := collection.FindOne(ctx, filter).Decode(&usuario)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("ℹ️ Usuario no encontrado para la cédula: %s", datos.Cedula)
			c.JSON(http.StatusNotFound, gin.H{"status": "error", "mensaje": "No se encontró ningún usuario con esa cédula"})
		} else if ctx.Err() == context.DeadlineExceeded {
			log.Printf("❌ ERROR: Tiempo de espera agotado al buscar usuario: %v", err)
			c.JSON(http.StatusGatewayTimeout, gin.H{"status": "error", "mensaje": "El servidor tardó demasiado en responder. Por favor, intente nuevamente"})
		} else {
			log.Printf("❌ ERROR: Error al buscar usuario en la base de datos: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "mensaje": "Error interno al buscar usuario. Por favor, intente más tarde"})
		}
		return
	}

	log.Printf("✅ Usuario encontrado exitosamente: %s", datos.Cedula)
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": usuario})
}

func actualizarUsuario(c *gin.Context) {
	var usuario Usuario

	if err := c.ShouldBindJSON(&usuario); err != nil {
		log.Println("❌ ERROR: Datos JSON inválidos:", err)
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "mensaje": "Datos inválidos"})
		return
	}

	// Validar campos obligatorios
	errores := validarCamposUsuario(usuario)
	if len(errores) > 0 {
		log.Println("❌ ERROR: Validación fallida:", errores)
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "mensaje": "Datos inválidos", "errores": errores})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Verificar si existe el usuario
	var usuarioExistente Usuario
	err := collection.FindOne(ctx, bson.M{"cedula": usuario.Cedula}).Decode(&usuarioExistente)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("❌ ERROR: No existe un usuario con la cédula %s", usuario.Cedula)
			c.JSON(http.StatusNotFound, gin.H{"status": "error", "mensaje": "Usuario no encontrado"})
		} else {
			log.Println("❌ ERROR: Error al buscar usuario:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "mensaje": "Error al buscar usuario"})
		}
		return
	}

	// Verificar si el correo ya está en uso por otro usuario
	if usuario.Correo != usuarioExistente.Correo {
		var usuarioCorreo Usuario
		err = collection.FindOne(ctx, bson.M{"correo": usuario.Correo}).Decode(&usuarioCorreo)
		if err == nil && usuarioCorreo.Cedula != usuario.Cedula {
			log.Printf("❌ ERROR: El correo %s ya está en uso por otro usuario", usuario.Correo)
			c.JSON(http.StatusConflict, gin.H{"status": "error", "mensaje": "El correo electrónico ya está en uso por otro usuario"})
			return
		} else if err != nil && err != mongo.ErrNoDocuments {
			log.Println("❌ ERROR: Error al verificar correo existente:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "mensaje": "Error al verificar correo existente"})
			return
		}
	}

	resultado, err := collection.UpdateOne(
		ctx,
		bson.M{"cedula": usuario.Cedula},
		bson.M{"$set": bson.M{
			"nombres":    usuario.Nombres,
			"apellidos":  usuario.Apellidos,
			"correo":     usuario.Correo,
			"telefono":   usuario.Telefono,
			"contrasena": usuario.Contrasena,
			"foto":       usuario.Foto,
		}},
	)

	if err != nil {
		log.Println("❌ ERROR: No se pudo actualizar en MongoDB:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "mensaje": "Error al actualizar usuario"})
		return
	}

	if resultado.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "mensaje": "Usuario no encontrado"})
		return
	}

	log.Println("✅ Usuario actualizado con éxito:", usuario.Cedula)
	c.JSON(http.StatusOK, gin.H{"status": "success", "mensaje": "Usuario actualizado con éxito"})
}

func eliminarUsuario(c *gin.Context) {
	var datos struct {
		Cedula string `json:"cedula"`
	}

	if err := c.ShouldBindJSON(&datos); err != nil {
		log.Println("❌ ERROR: Datos JSON inválidos:", err)
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "mensaje": "Cédula inválida"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resultado, err := collection.DeleteOne(ctx, bson.M{"cedula": datos.Cedula})

	if err != nil {
		log.Println("❌ ERROR: No se pudo eliminar en MongoDB:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "mensaje": "Error al eliminar usuario"})
		return
	}

	if resultado.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "mensaje": "Usuario no encontrado"})
		return
	}

	log.Println("✅ Usuario eliminado con éxito:", datos.Cedula)
	c.JSON(http.StatusOK, gin.H{"status": "success", "mensaje": "Usuario eliminado con éxito"})
}

func compararImagenes(imgDB, imgCapturada string) bool {
	url := "https://api-us.faceplusplus.com/facepp/v3/compare"
	apiKey := "rTogCX8PP4oEPuGPnBDGP53P-t6FnAhS"
	apiSecret := "UOXvVHFq4bxKeE7uEiknmGRIUJKLPxQl"

	if apiKey == "" || apiSecret == "" {
		log.Println("❌ ERROR: API Key o Secret están vacíos")
		return false
	}

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	_ = writer.WriteField("api_key", apiKey)
	_ = writer.WriteField("api_secret", apiSecret)
	_ = writer.WriteField("image_base64_1", imgDB)
	_ = writer.WriteField("image_base64_2", imgCapturada)
	writer.Close()

	req, err := http.NewRequest("POST", url, &buf)
	if err != nil {
		log.Println("❌ ERROR: No se pudo crear la solicitud:", err)
		return false
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("❌ ERROR: No se pudo conectar con Face++ API:", err)
		return false
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	log.Println("📢 Respuesta de Face++ API:", string(body))

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		log.Println("❌ ERROR: No se pudo analizar la respuesta JSON:", err)
		return false
	}

	if errorMsg, ok := result["error_message"]; ok {
		log.Println("❌ ERROR en Face++ API:", errorMsg)
		return false
	}

	if confidence, ok := result["confidence"].(float64); ok {
		log.Printf("✅ Nivel de confianza: %.2f", confidence)
		return confidence > 70.0
	}

	log.Println("❌ ERROR: No se recibió confianza en la respuesta")
	return false
}

func verificarCorreo(c *gin.Context) {
	var datos struct {
		Email string `json:"email"`
	}

	if err := c.ShouldBindJSON(&datos); err != nil {
		log.Println("❌ ERROR: Datos JSON inválidos:", err)
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Datos inválidos"})
		return
	}

	if datos.Email == "" {
		log.Println("❌ ERROR: Email vacío")
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "El email no puede estar vacío"})
		return
	}

	log.Printf("🔍 Verificando correo: %s", datos.Email)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var usuario Usuario
	filter := bson.M{"correo": datos.Email}

	err := collection.FindOne(ctx, filter).Decode(&usuario)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("ℹ️ Usuario no encontrado para el correo: %s", datos.Email)
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "No se encontró ningún usuario con ese correo"})
		} else {
			log.Printf("❌ ERROR: Error al buscar usuario en la base de datos: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error interno al buscar usuario"})
		}
		return
	}

	log.Printf("✅ Correo verificado exitosamente: %s", datos.Email)
	c.JSON(http.StatusOK, gin.H{"success": true, "cedula": usuario.Cedula})
}

func verificarRostro(c *gin.Context) {
	var datos struct {
		Cedula string `json:"cedula"`
		Foto   string `json:"foto"`
	}

	if err := c.ShouldBindJSON(&datos); err != nil {
		log.Println("❌ ERROR: Datos JSON inválidos:", err)
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Datos inválidos"})
		return
	}

	if datos.Cedula == "" || datos.Foto == "" {
		log.Println("❌ ERROR: Cédula o foto vacía")
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "La cédula y la foto no pueden estar vacías"})
		return
	}

	log.Printf("🔍 Verificando rostro para cédula: %s", datos.Cedula)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var usuario Usuario
	filter := bson.M{"cedula": datos.Cedula}

	err := collection.FindOne(ctx, filter).Decode(&usuario)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("ℹ️ Usuario no encontrado para la cédula: %s", datos.Cedula)
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "No se encontró ningún usuario con esa cédula"})
		} else {
			log.Printf("❌ ERROR: Error al buscar usuario en la base de datos: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error interno al buscar usuario"})
		}
		return
	}

	if !compararImagenes(usuario.Foto, datos.Foto) {
		log.Printf("❌ ERROR: Verificación facial fallida para cédula %s", datos.Cedula)
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Verificación facial fallida"})
		return
	}

	log.Printf("✅ Verificación facial exitosa para cédula %s", datos.Cedula)
	c.JSON(http.StatusOK, gin.H{"success": true, "mensaje": "Verificación facial exitosa"})
}

func actualizarUltimaSesion(c *gin.Context) {
	var datos struct {
		Cedula       string `json:"cedula"`
		UltimaSesion string `json:"ultimaSesion"`
	}

	if err := c.ShouldBindJSON(&datos); err != nil {
		log.Println("❌ ERROR: Datos JSON inválidos:", err)
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Datos inválidos"})
		return
	}

	if datos.Cedula == "" || datos.UltimaSesion == "" {
		log.Println("❌ ERROR: Cédula o fecha de última sesión vacía")
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "La cédula y la fecha de última sesión no pueden estar vacías"})
		return
	}

	log.Printf("🔄 Actualizando última sesión para cédula: %s", datos.Cedula)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resultado, err := collection.UpdateOne(
		ctx,
		bson.M{"cedula": datos.Cedula},
		bson.M{"$set": bson.M{"ultimaSesion": datos.UltimaSesion}},
	)

	if err != nil {
		log.Println("❌ ERROR: No se pudo actualizar en MongoDB:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error al actualizar última sesión"})
		return
	}

	if resultado.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Usuario no encontrado"})
		return
	}

	log.Printf("✅ Última sesión actualizada con éxito para cédula %s", datos.Cedula)
	c.JSON(http.StatusOK, gin.H{"success": true, "mensaje": "Última sesión actualizada con éxito"})
}
