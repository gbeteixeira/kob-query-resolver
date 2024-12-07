const DEFAULT_TRANSLATIONS: Record<string, Record<string, string>> = {
    'en': {
        // Geral
        'errors.criteriaNotConfigured': 'Criteria {{criterion}} is not configured',
        'errors.computeValueFailed': 'Failed to compute value for criteria {{criterion}}',
        'errors.expression': 'Error processing expression: {{message}}',

        // Validações gerais
        'errors.criteriaExists': 'Criteria {{criterion}} must exist',
        'errors.criteriaIn': 'Criteria {{criterion}} must be one of {{values}}',
        'errors.criteriaIncludes': 'Criteria {{criterion}} must include all values {{values}}',
        'errors.criteriaArray': 'Criteria {{criterion}} must be an array',

        // Tipos de dados
        'errors.numberType': 'Criteria {{criterion}} must be a number',
        'errors.stringType': 'Criteria {{criterion}} must be a string',
        'errors.booleanType': 'Criteria {{criterion}} must be a boolean',

        // Comparações numéricas
        'errors.betweenRange': 'Criteria {{criterion}} must be between {{min}} and {{max}}',
        'errors.greaterThanEqual': 'Criteria {{criterion}} must be greater than or equal to {{value}}',
        'errors.lessThanEqual': 'Criteria {{criterion}} must be less than or equal to {{value}}',
        'errors.greaterThan': 'Criteria {{criterion}} must be greater than {{value}}',
        'errors.lessThan': 'Criteria {{criterion}} must be less than {{value}}',
        'errors.equalTo': 'Criteria {{criterion}} must be equal to {{value}}',

        // Validações personalizadas
        'errors.customValidationFailed': 'Custom validation failed for criteria {{criterion}}',

        // Operadores lógicos
        'errors.logicalOperator.and': 'AND condition failed',
        'errors.logicalOperator.or': 'OR condition failed',
        'errors.logicalOperator.not': 'NOT condition failed',

        // Validações de formato
        'errors.emailFormat': 'Criteria {{criterion}} must be a valid email address',
        'errors.urlFormat': 'Criteria {{criterion}} must be a valid URL',
        'errors.dateFormat': 'Criteria {{criterion}} must be a valid date',

        // Comprimento e tamanho
        'errors.minLength': 'Criteria {{criterion}} must have a minimum length of {{min}}',
        'errors.maxLength': 'Criteria {{criterion}} must have a maximum length of {{max}}',
        'errors.exactLength': 'Criteria {{criterion}} must have exactly {{length}} characters',

        // Validações de intervalo para outros tipos
        'errors.dateRange': 'Criteria {{criterion}} must be between {{start}} and {{end}}',
        'errors.arraySize': 'Criteria {{criterion}} must have between {{min}} and {{max}} items',

        // Validações de padrão (regex)
        'errors.patternMatch': 'Criteria {{criterion}} does not match the required pattern',
    },
    'pt': {
        // Geral
        'errors.criteriaNotConfigured': 'Critério {{criterion}} não configurado',
        'errors.computeValueFailed': 'Erro ao computar valor para o critério {{criterion}}',
        'errors.expression': 'Erro ao processar expressão: {{message}}',

        // Validações gerais
        'errors.criteriaExists': 'Critério {{criterion}} deve existir',
        'errors.criteriaIn': 'Critério {{criterion}} deve ser um dos valores: {{values}}',
        'errors.criteriaIncludes': 'Critério {{criterion}} deve incluir todos os valores {{values}}',
        'errors.criteriaArray': 'Critério {{criterion}} deve ser um array',

        // Tipos de dados
        'errors.numberType': 'Critério {{criterion}} deve ser um número',
        'errors.stringType': 'Critério {{criterion}} deve ser uma string',
        'errors.booleanType': 'Critério {{criterion}} deve ser um booleano',

        // Comparações numéricas
        'errors.betweenRange': 'Critério {{criterion}} deve estar entre {{min}} e {{max}}',
        'errors.greaterThanEqual': 'Critério {{criterion}} deve ser maior ou igual a {{value}}',
        'errors.lessThanEqual': 'Critério {{criterion}} deve ser menor ou igual a {{value}}',
        'errors.greaterThan': 'Critério {{criterion}} deve ser maior que {{value}}',
        'errors.lessThan': 'Critério {{criterion}} deve ser menor que {{value}}',
        'errors.equalTo': 'Critério {{criterion}} deve ser igual a {{value}}',

        // Validações personalizadas
        'errors.customValidationFailed': 'Validação personalizada falhou para o critério {{criterion}}',

        // Operadores lógicos
        'errors.logicalOperator.and': 'Condição AND falhou',
        'errors.logicalOperator.or': 'Condição OR falhou',
        'errors.logicalOperator.not': 'Condição NOT falhou',

        // Validações de formato
        'errors.emailFormat': 'Critério {{criterion}} deve ser um endereço de email válido',
        'errors.urlFormat': 'Critério {{criterion}} deve ser uma URL válida',
        'errors.dateFormat': 'Critério {{criterion}} deve ser uma data válida',

        // Comprimento e tamanho
        'errors.minLength': 'Critério {{criterion}} deve ter no mínimo {{min}} caracteres',
        'errors.maxLength': 'Critério {{criterion}} deve ter no máximo {{max}} caracteres',
        'errors.exactLength': 'Critério {{criterion}} deve ter exatamente {{length}} caracteres',

        // Validações de intervalo para outros tipos
        'errors.dateRange': 'Critério {{criterion}} deve estar entre {{start}} e {{end}}',
        'errors.arraySize': 'Critério {{criterion}} deve ter entre {{min}} e {{max}} itens',

        // Validações de padrão (regex)
        'errors.patternMatch': 'Critério {{criterion}} não corresponde ao padrão exigido',
    },
    'es': {
        // Geral
        'errors.criteriaNotConfigured': 'Criterio {{criterion}} no configurado',
        'errors.computeValueFailed': 'Error al calcular el valor para el criterio {{criterion}}',
        'errors.expression': 'Error al procesar la expresión: {{message}}',

        // Validações gerais
        'errors.criteriaExists': 'El criterio {{criterion}} debe existir',
        'errors.criteriaIn': 'El criterio {{criterion}} debe ser uno de los valores: {{values}}',
        'errors.criteriaIncludes': 'El criterio {{criterion}} debe incluir todos los valores {{values}}',
        'errors.criteriaArray': 'El criterio {{criterion}} debe ser un array',

        // Tipos de dados
        'errors.numberType': 'El criterio {{criterion}} debe ser un número',
        'errors.stringType': 'El criterio {{criterion}} debe ser una cadena de texto',
        'errors.booleanType': 'El criterio {{criterion}} debe ser un booleano',

        // Comparações numéricas
        'errors.betweenRange': 'El criterio {{criterion}} debe estar entre {{min}} y {{max}}',
        'errors.greaterThanEqual': 'El criterio {{criterion}} debe ser mayor o igual a {{value}}',
        'errors.lessThanEqual': 'El criterio {{criterion}} debe ser menor o igual a {{value}}',
        'errors.greaterThan': 'El criterio {{criterion}} debe ser mayor que {{value}}',
        'errors.lessThan': 'El criterio {{criterion}} debe ser menor que {{value}}',
        'errors.equalTo': 'El criterio {{criterion}} debe ser igual a {{value}}',

        // Validações personalizadas
        'errors.customValidationFailed': 'La validación personalizada falló para el criterio {{criterion}}',

        // Operadores lógicos
        'errors.logicalOperator.and': 'Condición AND fallida',
        'errors.logicalOperator.or': 'Condición OR fallida',
        'errors.logicalOperator.not': 'Condición NOT fallida',

        // Validações de formato
        'errors.emailFormat': 'El criterio {{criterion}} debe ser una dirección de correo electrónico válida',
        'errors.urlFormat': 'El criterio {{criterion}} debe ser una URL válida',
        'errors.dateFormat': 'El criterio {{criterion}} debe ser una fecha válida',

        // Comprimento e tamanho
        'errors.minLength': 'El criterio {{criterion}} debe tener al menos {{min}} caracteres',
        'errors.maxLength': 'El criterio {{criterion}} debe tener como máximo {{max}} caracteres',
        'errors.exactLength': 'El criterio {{criterion}} debe tener exactamente {{length}} caracteres',

        // Validações de intervalo para outros tipos
        'errors.dateRange': 'El criterio {{criterion}} debe estar entre {{start}} y {{end}}',
        'errors.arraySize': 'El criterio {{criterion}} debe tener entre {{min}} y {{max}} elementos',

        // Validações de padrão (regex)
        'errors.patternMatch': 'El criterio {{criterion}} no cumple con el patrón requerido',
    }
};

export default DEFAULT_TRANSLATIONS;