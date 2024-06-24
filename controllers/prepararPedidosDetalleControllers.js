const sql = require('mssql');
const logger = require('../config/logger.js');
const { connectToDatabase, closeDatabaseConnection } = require('../config/database.js');
const moment = require('moment');

/**
 * Prepara los datos para insertar en la tabla pedidosDet.
 * @param {Object} req - El objeto de solicitud HTTP.
 * @param {Object} res - El objeto de respuesta HTTP.
 */
async function prepararDataPedidosDet(req, res) {
    try {
        const arrayPedidos = req.body.arrayPedidos;
        const responsePedidos = req.body.responsePedidos;

        logger.info('Iniciando la función prepararDataPedidosDet');
        logger.debug(`arrayPedidos ${JSON.stringify(arrayPedidos)}`);
        logger.debug(`responsePedidos ${JSON.stringify(responsePedidos)}`);
        
        // Mapear los ítems de los pedidos
        const itemList = arrayPedidos.flatMap(elemento =>
            elemento.itens.map(item => ({
                ...item,
                pedido: elemento.pedido,
                tipoDocumento: elemento.tipoDocumento,
                folio: elemento.pedido,
                rutCliente: elemento.cnpj,
                observacion: elemento.observacao
            }))
        );

        // Establecer correlativo y tipo de ítem para cada ítem
        for (const item of itemList) {
            const pedidoEncontrado = responsePedidos.find(pedido => pedido.output.ResultadoID === item.pedido.toString());
            if (pedidoEncontrado) {
                item.ID = pedidoEncontrado.output.ID;
                item.tipoItem = await obtenerTipoItem(item);
            }
        }

        // Establecer correlativo para cada pedido
        for (const item of arrayPedidos) {
            const pedidoEncontrado = responsePedidos.find(pedido => pedido.idPedido === item.pedido);
            if (pedidoEncontrado) {
                item.ID = pedidoEncontrado.output.ID;
            }
        }

        const data = { item: itemList, pedidos: arrayPedidos };

        logger.debug(`Fin de la función prepararDataPedidosDet ${JSON.stringify(data)}`);
        res.status(200).json(data);
    } catch (error) {
        // Manejamos cualquier error ocurrido durante el proceso
        logger.error(`Error en prepararDataPedidosDet: ${error.message}`);
        res.status(500).json({ error: `Error en el servidor [preparar-pedidos-detalle-ms] :  ${error.message}`  });
    }
}

/**
 * Obtiene el tipo de ítem para un ítem dado.
 * @param {Object} item - El ítem para el cual se desea obtener el tipo.
 * @returns {string} - El tipo de ítem.
 */
async function obtenerTipoItem(item) {
    try {
        logger.info('Iniciando la función obtenerTipoItem');
        await connectToDatabase('DTEBdQMakita');
        const consulta = `SELECT TipoItem FROM Item WHERE item = '${item.referencia}'`;
        const result = await sql.query(consulta);
        await closeDatabaseConnection();

        if (result.recordset.length > 0) {
            return result.recordset[0].TipoItem;
        } else {
            return null;
        }
        
        
    } catch (error) {
       
        // Manejamos cualquier error ocurrido durante el proceso
         logger.error(`Error al consultar el tipo de ítem: ${error.message}`);
         res.status(500).json({ error: `Error en el servidor [obtenerTipoItem] :  ${error.message}`  });
    }
}

module.exports = {
    prepararDataPedidosDet
};
