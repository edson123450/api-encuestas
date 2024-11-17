// Importar el SDK de AWS
const AWS = require('aws-sdk');

// Configurar DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.lambda_handler = async (event) => {
    // Obtener valores del cuerpo de la solicitud
    let tenantCPrograma, tipoCEstudiante, descripcion;
    if (typeof event.body === 'string') {
        const parsedBody = JSON.parse(event.body);
        tenantCPrograma = parsedBody['tenant_id#c_programa'];
        tipoCEstudiante = parsedBody['tipo#c_estudiante'];
        descripcion = parsedBody['descripcion'];
    } else {
        tenantCPrograma = event.body['tenant_id#c_programa'];
        tipoCEstudiante = event.body['tipo#c_estudiante'];
        descripcion = event.body['descripcion'];
    }

    try {
        // Crear los datos para el ítem a insertar
        const [tenantId, cPrograma] = tenantCPrograma.split('#');
        const [tipo, cEstudiante] = tipoCEstudiante.split('#');

        // Construir el ítem
        const item = {
            'tenant_id#c_programa': tenantCPrograma, // Partition Key (base)
            'tipo#c_estudiante': tipoCEstudiante,    // Sort Key (base)
            'tenant_id#tipo': `${tenantId}#${tipo}`, // Partition Key (GSI 1)
            'c_programa#c_estudiante': `${cPrograma}#${cEstudiante}`, // Sort Key (GSI 1)
            'tenant_id#c_estudiante': `${tenantId}#${cEstudiante}`, // Partition Key (GSI 2)
            'tipo#c_programa': `${tipo}#${cPrograma}`, // Sort Key (GSI 2)
            'descripcion': descripcion, // Atributo adicional
        };

        // Configurar los parámetros para la operación de escritura
        const params = {
            TableName: 'tabla_encuestas',
            Item: item,
        };

        // Insertar el ítem en la tabla
        await dynamoDB.put(params).promise();

        // Retornar una respuesta exitosa
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'success',
                message: 'Encuesta creada correctamente.',
                data: item,
            }, null, 2),
        };
    } catch (error) {
        console.error('Error al insertar en DynamoDB:', error);

        // Retornar error en caso de fallo
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'error',
                message: 'Ocurrió un error al crear la encuesta.',
                error: error.message,
            }, null, 2),
        };
    }
};