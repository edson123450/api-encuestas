// Importar el SDK de AWS
const AWS = require('aws-sdk');

// Configurar DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.lambda_handler = async (event) => {
    // Obtener el tenant_id desde el body
    let tenantId;
    if (typeof event.body === 'string') {
        tenantId = JSON.parse(event.body)['tenant_id'];
    } else {
        tenantId = event.body['tenant_id'];
    }

    try {
        // Configurar parámetros para el escaneo
        const params = {
            TableName: 'tabla_encuestas',
        };

        // Escanear la tabla
        const data = await dynamoDB.scan(params).promise();

        // Filtrar los ítems cuyo partition key comience con el tenant_id
        const encuestas = data.Items.filter(item => 
            item['tenant_id#c_programa'].startsWith(tenantId)
        );

        // Retornar los datos filtrados
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'success',
                data: encuestas,
            }, null, 2),
        };
    } catch (error) {
        console.error('Error al escanear DynamoDB:', error);

        // Manejar errores
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'error',
                message: 'Ocurrió un error al listar las encuestas.',
                error: error.message,
            }, null, 2),
        };
    }
};