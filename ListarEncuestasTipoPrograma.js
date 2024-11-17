// Importar el SDK de AWS
const AWS = require('aws-sdk');

// Configurar DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.lambda_handler = async (event) => {
    // Obtener valores del body
    let tenantTipo, cPrograma;
    if (typeof event.body === 'string') {
        const parsedBody = JSON.parse(event.body);
        tenantTipo = parsedBody['tenant_id#tipo'];
        cPrograma = parsedBody['c_programa'];
    } else {
        tenantTipo = event.body['tenant_id#tipo'];
        cPrograma = event.body['c_programa'];
    }

    try {
        // Configurar los parámetros para la consulta
        const params = {
            TableName: 'tabla_encuestas',
            IndexName: 'tenanttipo-cprogramacestudiante', // Nombre del GSI
            KeyConditionExpression: '#tenantTipo = :tenantTipoValue AND begins_with(#sortKey, :cProgramaValue)',
            ExpressionAttributeNames: {
                '#tenantTipo': 'tenant_id#tipo', // Partition key del GSI
                '#sortKey': 'c_programa#c_estudiante', // Sort key del GSI
            },
            ExpressionAttributeValues: {
                ':tenantTipoValue': tenantTipo,
                ':cProgramaValue': cPrograma,
            },
        };

        // Ejecutar la consulta
        const data = await dynamoDB.query(params).promise();

        // Retornar los datos obtenidos
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'success',
                data: data.Items,
            }, null, 2),
        };
    } catch (error) {
        console.error('Error al consultar DynamoDB:', error);

        // Manejar errores
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'error',
                message: 'Ocurrió un error al listar las encuestas por tipo y programa.',
                error: error.message,
            }, null, 2),
        };
    }
};