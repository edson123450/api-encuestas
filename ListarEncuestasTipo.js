// Importar el SDK de AWS
const AWS = require('aws-sdk');

// Configurar DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.lambda_handler = async (event) => {
    // Obtener el tenant_id#tipo desde el body
    let tenantTipo;
    if (typeof event.body === 'string') {
        tenantTipo = JSON.parse(event.body)['tenant_id#tipo'];
    } else {
        tenantTipo = event.body['tenant_id#tipo'];
    }

    try {
        // Configurar los parámetros para la consulta
        const params = {
            TableName: 'tabla_encuestas',
            IndexName: 'tenanttipo-cprogramacestudiante', // Nombre del GSI
            KeyConditionExpression: '#tenantTipo = :tenantTipoValue',
            ExpressionAttributeNames: {
                '#tenantTipo': 'tenant_id#tipo', // Partition key del GSI
            },
            ExpressionAttributeValues: {
                ':tenantTipoValue': tenantTipo,
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
                message: 'Ocurrió un error al listar las encuestas por tipo.',
                error: error.message,
            }, null, 2),
        };
    }
};