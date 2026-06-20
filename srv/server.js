// Importamos CAP.
// "cds" es la herramienta principal que usa SAP CAP en Node.js.
const cds = require('@sap/cds')

// Este evento se ejecuta cuando CAP está arrancando el servidor.
// "bootstrap" significa algo como: "antes de que el servidor quede listo".
cds.on('bootstrap', app => {

  // Aquí creamos una ruta REST.
  // Cuando alguien abra /api/customers en el navegador,
  // se ejecutará el código que está dentro.
  app.get('/api/customers', async (req, res) => {

    // Nos conectamos a la base de datos que CAP está usando.
    // En nuestro caso, mientras practicamos, CAP usa SQLite en memoria.
    const db = await cds.connect.to('db')

    // Hacemos una consulta a la entidad real del modelo.
    // Esta entidad viene de db/schema.cds:
    //
    // namespace com.logali;
    //
    // entity Customer {
    //   key ID : Integer;
    //   name   : String;
    // }
    //
    // Por eso el nombre completo es:
    // com.logali.Customer
    const customers = await db.run(
      SELECT.from('com.logali.Customer')
    )

    // Enviamos la respuesta al navegador en formato JSON.
    // JSON es un formato de texto muy usado para APIs.
    res.json(customers)
  })

})

// Exportamos el servidor de CAP.
// Esto permite que CAP use este archivo al arrancar.
module.exports = cds.server