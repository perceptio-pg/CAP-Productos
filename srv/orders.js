// Importa el módulo principal de SAP CAP.
// Permite acceder al modelo CDS, entidades, servicios y base de datos.
const cds = require('@sap/cds');

// Se usa en la logica el SELECT y UPDATE de CAP para realizar consultas y actualizaciones en la base de datos.
const { UPDATE, SELECT } = cds.ql;

// Obtiene la entidad Orders perteneciente al namespace "com.training".
// Este namespace está definido en el archivo db/training.cds.
const { Orders } = cds.entities('com.training');

// Exporta la implementación del servicio.
// CAP ejecuta esta función y proporciona el servicio mediante "srv".
module.exports = (srv) => {

  //*******READ********/
  // Registra un manejador para el evento READ de la entidad GetOrders.
  // Este evento se ejecuta al realizar una petición GET sobre GetOrders.
  srv.on('READ', 'Orders', async (req) => {

    // Extrae ClientEmail de los datos de la petición.
    // Cuando se consulta GetOrders('email'), CAP coloca la clave
    // ClientEmail dentro de req.data.
    const { ClientEmail } = req.data;

    // Si se recibió un email, se realizará una consulta individual.
    if (ClientEmail) {

      // Busca un único registro en la entidad original Orders.
      // La condición equivale a:
      // WHERE ClientEmail = <email recibido>
      const order = await SELECT.one
        .from(Orders)
        .where({ ClientEmail });

      // Si la consulta no encontró ninguna orden, devuelve un error
      // HTTP 404 indicando que el recurso solicitado no existe.
      if (!order) {
        return req.reject(
          404,
          `No existe una orden para ${ClientEmail}`
        );
      }

      // Devuelve la orden encontrada.
      return order;
    }


    // Si no se recibió ClientEmail, devuelve todas las órdenes.
    // Esta parte se ejecuta al consultar:
    // GET /odata/v4/manage-orders/GetOrders
    return SELECT.from(Orders);
  });

  srv.after('READ', 'GetOrders', (data) => {
    return data.map((order) => {
      // Agrega un nuevo campo a cada orden devuelta.
      // Este campo no existe en la entidad original Orders.
      order.Reviewed = true;
    });
  });

  /*********** CREATE ***********/
  srv.on('CREATE', 'Orders', async (req) => {
    // Extraemos únicamente los datos que necesita la operación.
    const {
      ClientEmail,
      FirstName,
      LastName
    } = req.data;

    // Validaciones de negocio antes de acceder a la base de datos.
    // req.reject() detiene inmediatamente la ejecución.
    if (!ClientEmail?.trim()) {
      return req.reject(
        400,
        'El correo del cliente es obligatorio',
        'ClientEmail'
      );
    }

    if (!FirstName?.trim()) {
      return req.reject(
        400,
        'El nombre del cliente es obligatorio',
        'FirstName'
      );
    }

    try {
      // Construimos el registro explícitamente para evitar guardar
      // propiedades adicionales enviadas por el cliente.
      const newOrder = {
        ClientEmail: ClientEmail.trim().toLowerCase(),
        FirstName: FirstName.trim(),
        LastName: LastName?.trim() || null,

        // Estos valores los controla el servidor.
        CreatedOn: new Date().toISOString(),
        Reviewed: false,
        Approved: false
      };

      // CAP ejecuta este INSERT dentro de la transacción
      // asociada automáticamente a la petición actual.
      await INSERT
        .into(Orders)
        .entries(newOrder);

      // Devolvemos la orden creada al consumidor del servicio.
      return newOrder;
    } catch (error) {
      // El detalle técnico queda solamente en los registros del servidor.
      console.error('Error al crear la orden:', error);

      // Si tu base de datos reporta un conflicto conocido,
      // respondemos con HTTP 409.
      if (error.status === 409 || error.statusCode === 409) {
        return req.reject(
          409,
          'Ya existe una orden con esos datos'
        );
      }

      // No exponemos error.message porque podría contener
      // información interna de la base de datos.
      return req.reject(
        500,
        'No fue posible crear la orden'
      );
    }
  });

  /*********** UPDATE ***********/

  srv.on('UPDATE', 'Orders', async (req) => {
    // La clave puede llegar en el body o como parámetro de la URL.
    const clientEmail = (
      req.data.ClientEmail ??
      req.params?.[0]?.ClientEmail
    )?.trim().toLowerCase();

    // La orden no puede localizarse sin una clave.
    if (!clientEmail) {
      return req.reject(
        400,
        'El correo del cliente es obligatorio',
        'ClientEmail'
      );
    }

    // Construimos dinámicamente los cambios.
    // Así no reemplazamos con undefined los campos no enviados.
    const changes = {};

    if (req.data.FirstName !== undefined) {
      const firstName = req.data.FirstName?.trim();

      if (!firstName) {
        return req.reject(
          400,
          'El nombre no puede estar vacío',
          'FirstName'
        );
      }

      changes.FirstName = firstName;
    }

    if (req.data.LastName !== undefined) {
      // Permite establecer el apellido en null.
      changes.LastName =
        req.data.LastName?.trim() || null;
    }

    // Evita ejecutar una actualización sin cambios.
    if (Object.keys(changes).length === 0) {
      return req.reject(
        400,
        'No se enviaron campos válidos para actualizar'
      );
    }

    try {
      // No usamos cds.transaction(req):
      // CAP administra la transacción de la petición.
      const affectedRows = await UPDATE(Orders)
        .set(changes)
        .where({ ClientEmail: clientEmail });

      // UPDATE devuelve el número de registros afectados.
      if (affectedRows === 0) {
        return req.reject(
          404,
          'No se encontró una orden con ese correo'
        );
      }

      // Devolvemos al cliente el registro ya actualizado.
      return await SELECT.one
        .from(Orders)
        .where({ ClientEmail: clientEmail });
    } catch (error) {
      // Los errores creados por req.reject() deben conservarse.
      if (error.status && error.status < 500) {
        throw error;
      }

      // El detalle técnico queda solo en el servidor.
      console.error('Error al actualizar la orden:', error);

      return req.reject(
        500,
        'No fue posible actualizar la orden'
      );
    }
  });

  /*********** DELETE ***********/
  srv.on('DELETE', 'Orders', async (req) => {
    // La clave puede venir en el body o en la URL.
    const clientEmail = (
      req.data.ClientEmail ??
      req.params?.[0]?.ClientEmail
    )?.trim().toLowerCase();

    if (!clientEmail) {
      return req.reject(
        400,
        'El correo del cliente es obligatorio',
        'ClientEmail'
      );
    }

    try {
      // CAP administra automáticamente la transacción.
      const deletedRows = await DELETE
        .from(Orders)
        .where({ ClientEmail: clientEmail });

      // DELETE devuelve la cantidad de registros eliminados.
      if (deletedRows === 0) {
        return req.reject(
          404,
          'No se encontró una orden con ese correo'
        );
      }

      // No es necesario devolver contenido.
      // CAP responderá normalmente con HTTP 204.
      return;
    } catch (error) {
      // Conservamos los errores generados por req.reject().
      if (error.status && error.status < 500) {
        throw error;
      }

      console.error('Error al eliminar la orden:', error);

      return req.reject(
        500,
        'No fue posible eliminar la orden'
      );
    }
  });

  //*********** FUNCTION ***********/
  //No modifica la capa de persistencia, solo devuelve un valor calculado.
  // Registra el manejador de la función getClientTaxRate.
  // Se ejecutará cada vez que un consumidor invoque esta función.
  srv.on("getClientTaxRate", async (req) => {
  const { clientEmail } = req.data;

  // Validamos el parámetro recibido.
  if (!clientEmail?.trim()) {
    return req.reject(
      400,
      "El parámetro clientEmail es obligatorio"
    );
  }

  // Obtenemos la entidad Orders expuesta por ManageOrders.
  // Su nombre completo es ManageOrders.Orders, no com.training.Orders.
  const { Orders } = srv.entities;

  // CAP ejecuta la consulta dentro del contexto y la transacción
  // de la petición actual; no necesitamos srv.transaction(req).
  const order = await SELECT.one
    .from(Orders)
    .columns("Country_code")
    .where({
      ClientEmail: clientEmail.trim().toLowerCase()
    });

  // La consulta no encontró una orden.
  if (!order) {
    return req.reject(
      404,
      "No se encontraron pedidos para este cliente"
    );
  }

  // Tabla de tasas fiscales por código de país.
  const taxRates = {
    ES: 21.5,
    GB: 24.6,
    UK: 24.6
  };

  // Obtenemos la tasa correspondiente al país de la orden.
  const taxRate = taxRates[order.Country_code];

  // El país existe, pero no tiene una tasa configurada.
  if (taxRate === undefined) {
    return req.reject(
      422,
      `No hay una tasa fiscal configurada para el país ${order.Country_code}`
    );
  }

  // Decimal(4,2) devolverá valores como 21.50 o 24.60.
  return taxRate;
});

/*********** ACTION: CANCELAR ORDEN ***********/
srv.on("cancelOrder", async (req) => {
    // Extraemos el correo recibido por la acción.
    const { clientEmail } = req.data;

    // Validamos que se haya enviado un correo.
    if (!clientEmail?.trim()) {
        return req.reject(
            400,
            "El parámetro clientEmail es obligatorio"
        );
    }

    // Normalizamos el correo para evitar problemas con
    // espacios y diferencias entre mayúsculas y minúsculas.
    const normalizedEmail = clientEmail.trim().toLowerCase();

    // Obtenemos Orders desde las entidades expuestas
    // por el servicio ManageOrders.
    const { Orders } = srv.entities;

    // Buscamos una sola orden porque ClientEmail es la clave.
    const order = await SELECT.one
        .from(Orders)
        .columns("FirstName", "LastName", "Approved", "Status")
        .where({ ClientEmail: normalizedEmail });

    // Evitamos acceder a propiedades de undefined cuando
    // el correo no corresponde a ninguna orden.
    if (!order) {
        return {
            status: "Failed",
            message: "No existe una orden para el cliente indicado"
        };
    }

    // Comprobamos si la orden ya estaba cancelada.
    if (order.Status === "C") {
        return {
            status: "Failed",
            message:
                `The order placed by ${order.FirstName} ` +
                `${order.LastName ?? ""} was already canceled`
        };
    }

    // Una orden aprobada no puede cancelarse.
    if (order.Approved === true) {
        return {
            status: "Failed",
            message:
                `The order placed by ${order.FirstName} ` +
                `${order.LastName ?? ""} was NOT canceled ` +
                "because it was already approved"
        };
    }

    // Actualizamos únicamente si la orden sigue sin aprobar
    // y todavía no está cancelada.
    //
    // Incluir estas condiciones en el UPDATE reduce el riesgo
    // de cancelar una orden que fue aprobada justo después
    // de la consulta anterior.
    const affectedRows = await UPDATE(Orders)
        .set({ Status: "C" })
        .where({
            ClientEmail: normalizedEmail,
            Approved: false
        })
        .and("Status <> 'C' or Status is null");

    // Si no se modificó ningún registro, su estado pudo cambiar
    // entre la consulta y la actualización.
    if (affectedRows === 0) {
        return {
            status: "Failed",
            message:
                "La orden no pudo cancelarse porque su estado cambió"
        };
    }

    // La actualización se completó correctamente.
    return {
        status: "Succeeded",
        message:
            `The order placed by ${order.FirstName} ` +
            `${order.LastName ?? ""} was canceled`
    };
});

};




