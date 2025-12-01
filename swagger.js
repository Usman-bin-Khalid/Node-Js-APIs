const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ecommerce + Chat API Documentation",
      version: "1.0.0",
      description: "API documentation for Auth, Profile, Products, and Chat APIs"
    },
    servers: [
      {
        url: "https://<your-render-url>"  // Replace with your Render deployment URL
      }
    ]
  },

  // Pointing to route files where swagger comments will be written
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📄 Swagger Docs available at /api-docs");
}

module.exports = swaggerDocs;
