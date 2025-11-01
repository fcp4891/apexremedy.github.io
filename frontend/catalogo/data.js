// data.js - Datos del catálogo
const catalogData = {
    // Términos y condiciones de envíos
    terms: {
        title: "Términos y condiciones de envíos y entrega",
        content: `
            <p><strong>Política de Envíos:</strong></p>
            <ul>
                <li>Los envíos se realizan de lunes a viernes en horario de 9:00 AM a 6:00 PM</li>
                <li>Tiempo estimado de entrega: 24-48 horas dentro de la ciudad</li>
                <li>Para entregas fuera de la ciudad: 3-5 días hábiles</li>
                <li>Envío gratuito en compras superiores a $50.000</li>
            </ul>
            
            <p><strong>Condiciones de Entrega:</strong></p>
            <ul>
                <li>Se requiere firma del destinatario al momento de la entrega</li>
                <li>Es necesario presentar documento de identidad</li>
                <li>El producto debe ser revisado en presencia del mensajero</li>
                <li>Cualquier inconformidad debe reportarse de inmediato</li>
            </ul>
            
            <p><strong>Zonas de Cobertura:</strong></p>
            <ul>
                <li>Cobertura total en zona metropolitana</li>
                <li>Entregas a nivel nacional disponibles</li>
                <li>Consultar disponibilidad para zonas rurales</li>
            </ul>
        `
    },

    // Productos - Flores (Página 3)
    productsPage1: [
        {
            name: "Blue Dream",
            strain: "Híbrida (Sativa dominante)",
            image: "./images/products/blue-dream.jpg",
            prices: {
                "1g": "$15.000",
                "3.5g": "$45.000",
                "7g": "$85.000",
                "14g": "$160.000"
            }
        },
        {
            name: "OG Kush",
            strain: "Híbrida (Indica dominante)",
            image: "./images/products/og-kush.jpg",
            prices: {
                "1g": "$18.000",
                "3.5g": "$50.000",
                "7g": "$95.000",
                "14g": "$180.000"
            }
        },
        {
            name: "Sour Diesel",
            strain: "Sativa",
            image: "./images/products/sour-diesel.jpg",
            prices: {
                "1g": "$16.000",
                "3.5g": "$47.000",
                "7g": "$90.000",
                "14g": "$170.000"
            }
        },
        {
            name: "Purple Haze",
            strain: "Sativa",
            image: "./images/products/purple-haze.jpg",
            prices: {
                "1g": "$17.000",
                "3.5g": "$48.000",
                "7g": "$92.000",
                "14g": "$175.000"
            }
        }
    ],

    // Productos - Más Flores (Página 4)
    productsPage2: [
        {
            name: "White Widow",
            strain: "Híbrida equilibrada",
            image: "./images/products/white-widow.jpg",
            prices: {
                "1g": "$16.000",
                "3.5g": "$46.000",
                "7g": "$88.000",
                "14g": "$165.000"
            }
        },
        {
            name: "Gorilla Glue",
            strain: "Híbrida (Indica dominante)",
            image: "./images/products/gorilla-glue.jpg",
            prices: {
                "1g": "$19.000",
                "3.5g": "$52.000",
                "7g": "$98.000",
                "14g": "$185.000"
            }
        },
        {
            name: "Jack Herer",
            strain: "Sativa dominante",
            image: "./images/products/jack-herer.jpg",
            prices: {
                "1g": "$17.000",
                "3.5g": "$49.000",
                "7g": "$93.000",
                "14g": "$176.000"
            }
        },
        {
            name: "Northern Lights",
            strain: "Indica",
            image: "./images/products/northern-lights.jpg",
            prices: {
                "1g": "$16.000",
                "3.5g": "$47.000",
                "7g": "$89.000",
                "14g": "$168.000"
            }
        }
    ],

    // Hash (Página 5)
    hash: {
        title: "Hash Premium de Importación",
        images: [
            "./images/hash/hash-1.jpg",
            "./images/hash/hash-2.jpg",
            "./images/hash/hash-3.jpg",
            "./images/hash/hash-4.jpg"
        ],
        prices: {
            "1g": "$25.000",
            "3g": "$70.000",
            "5g": "$110.000",
            "10g": "$200.000"
        },
        note: "* Hash de máxima calidad importado de Marruecos. Textura suave y aromático. Contenido de THC: 40-50%."
    },

    // Aceites (Página 6)
    oils: [
        {
            name: "Aceite CBD Full Spectrum",
            description: "Aceite de CBD de espectro completo con todos los cannabinoides naturales. Ideal para uso terapéutico, ayuda con el dolor crónico, ansiedad e insomnio.",
            image: "./images/oils/cbd-oil.jpg",
            prices: {
                "10ml": "$45.000",
                "30ml": "$120.000",
                "50ml": "$180.000"
            },
            concentration: "1000mg CBD por 30ml"
        },
        {
            name: "Aceite THC Premium",
            description: "Aceite concentrado de THC de alta potencia. Extraído mediante CO2 supercrítico para máxima pureza. Uso medicinal y recreativo.",
            image: "./images/oils/thc-oil.jpg",
            prices: {
                "5ml": "$80.000",
                "10ml": "$150.000",
                "20ml": "$280.000"
            },
            concentration: "500mg THC por 10ml"
        }
    ],

    // Políticas Generales (Página 7)
    policies: {
        title: "Políticas Generales",
        content: `
            <h3>1. Política de Privacidad</h3>
            <p>Respetamos su privacidad y protegemos sus datos personales de acuerdo con las leyes vigentes. 
            La información recopilada se utiliza únicamente para procesar pedidos y mejorar nuestro servicio.</p>
            
            <h3>2. Métodos de Pago</h3>
            <ul>
                <li>Transferencia bancaria</li>
                <li>Efectivo contra entrega</li>
                <li>Criptomonedas (Bitcoin, USDT)</li>
                <li>Nequi / Daviplata</li>
            </ul>
            
            <h3>3. Política de Devoluciones</h3>
            <p>Aceptamos devoluciones dentro de las primeras 24 horas después de la entrega, siempre que:</p>
            <ul>
                <li>El producto esté en su empaque original sin abrir</li>
                <li>Se presente el comprobante de compra</li>
                <li>El motivo de devolución sea válido (producto defectuoso o incorrecto)</li>
            </ul>
            
            <h3>4. Descuentos y Promociones</h3>
            <ul>
                <li>Cliente frecuente: 10% de descuento en la 5ta compra</li>
                <li>Compras mayoristas: descuentos especiales a partir de $500.000</li>
                <li>Referidos: Gana $10.000 por cada amigo que refiera</li>
            </ul>
        `
    },
    
    // Políticas Generales Parte 2 (Página 8)
    policies2: {
        title: "Políticas Generales (Continuación)",
        content: `
            <h3>5. Atención al Cliente</h3>
            <p>Nuestro equipo está disponible para resolver cualquier duda o inconveniente:</p>
            <ul>
                <li>WhatsApp: +57 300 123 4567</li>
                <li>Email: info@apexremedy.com</li>
                <li>Horario: Lunes a Viernes 9:00 AM - 8:00 PM</li>
            </ul>
            
            <h3>6. Responsabilidad del Usuario</h3>
            <p>Al realizar una compra, el usuario acepta:</p>
            <ul>
                <li>Ser mayor de edad (18 años o más)</li>
                <li>Cumplir con las leyes locales sobre el uso de estos productos</li>
                <li>Usar los productos de manera responsable</li>
                <li>No revender los productos sin autorización</li>
            </ul>
            
            <h3>7. Garantía de Calidad</h3>
            <p>Todos nuestros productos son:</p>
            <ul>
                <li>Cultivados orgánicamente sin pesticidas</li>
                <li>Probados en laboratorio</li>
                <li>Almacenados en condiciones óptimas</li>
                <li>Con certificado de análisis disponible bajo solicitud</li>
            </ul>
        `
    }
};

// Exportar datos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = catalogData;
}