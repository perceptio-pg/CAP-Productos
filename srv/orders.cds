// Importa el namespace "com.training" desde el modelo db/training.cds.
//
// Se le asigna el alias "training", lo que permite usar:
// training.Orders
//
// en lugar del nombre completo:
// com.training.Orders
using com.training as training from '../db/training';


// Define el servicio OData llamado ManageOrders.
//
// Todo lo declarado dentro de este bloque será expuesto
// como parte de la API pública del servicio.
service ManageOrders {

    // Define un tipo de dato estructurado para devolver
    // el resultado de la acción cancelOrder.
    type cancelOrderReturn {

        // status indica si la cancelación fue exitosa o falló.
        //
        // Aunque su tipo base es String, el enum restringe
        // los posibles valores a Succeeded y Failed.
        status  : String enum {

            // Indica que la orden se canceló correctamente.
        Succeeded;

        // Indica que la orden no pudo cancelarse.
        Failed;
        };

        // Mensaje descriptivo sobre el resultado de la operación.
        //
        // Ejemplos:
        // "La orden fue cancelada correctamente"
        // "No se encontró la orden solicitada"
        message : String;
    };


    // Expone en el servicio la entidad Orders definida
    // originalmente dentro del namespace com.training.
    //
    // Entidad de persistencia:
    // com.training.Orders
    //
    // Entidad expuesta por el servicio:
    // ManageOrders.Orders
    entity Orders as projection on training.Orders
    //actions vincula los action y las funtions definidas en el servicio con la entidad Orders.
        actions {

            // Define una acción para aprobar una orden.
            //
            // Recibe el correo que identifica al cliente o la orden.
            //
            // Devuelve un objeto del tipo cancelOrderReturn:
            //
            // {
            //   "status": "Succeeded",
            //   "message": "La orden fue aprobada correctamente"
            // }
            //
            // Al ser una action, puede modificar la base de datos.
            // Por ejemplo, puede cambiar el estado de la orden.
            action   approveOrder(clientEmail: String(65))     returns cancelOrderReturn;


            // Define una función que recibe el correo del cliente
            // y devuelve su tasa fiscal.
            //
            // clientEmail:
            // Texto con una longitud máxima de 65 caracteres.
            //
            // Decimal(4,2):
            // Permite cuatro dígitos totales y dos decimales.
            // Ejemplos válidos: 21.50, 24.60 y 99.99.
            //
            // Al ser una function, debe utilizarse para consultar
            // o calcular información, sin modificar la base de datos.
            function getClientTaxRate(clientEmail: String(65)) returns Decimal(4, 2);


            // Define una acción para cancelar una orden.
            //
            // Recibe el correo que identifica al cliente o la orden.
            //
            // Devuelve un objeto del tipo cancelOrderReturn:
            //
            // {
            //   "status": "Succeeded",
            //   "message": "La orden fue cancelada correctamente"
            // }
            //
            // Al ser una action, puede modificar la base de datos.
            // Por ejemplo, puede eliminar la orden o cambiar su estado.
            action   cancelOrder(clientEmail: String(65))      returns cancelOrderReturn;
        };
}
