// ⚠️ Traducción borrador pendiente de revisión legal antes del lanzamiento.
import { MARKET } from "@/markets";
import { LegalPage, LegalEntityBox, Section, SubSection, MailLink, SiteLink, privacyEmail } from "./LegalLayout";

const PrivacyPolicyEs = () => (
  <LegalPage
    seoTitle={`Política de Privacidad y Cookies — ${MARKET.siteName}`}
    seoDescription={`Información sobre el tratamiento de los datos personales de los usuarios del sitio ${MARKET.siteName}.`}
    path="/privacy"
    backAria="Atrás"
    heading="Política de Privacidad y Cookies"
    lastUpdated="Última actualización: 24 de abril de 2026"
  >
    <p className="text-base leading-relaxed text-foreground/90 mb-10">
      Esta política describe cómo se tratan los datos personales de los usuarios que visitan el sitio <SiteLink /> y
      utilizan los servicios vinculados a la marca {MARKET.siteName}.
    </p>

    <Section title="1. Responsable del tratamiento">
      <p>El Responsable del tratamiento es:</p>
      <LegalEntityBox />
      <p>
        Para cualquier solicitud relativa al tratamiento de los datos personales se puede escribir a:{" "}
        <MailLink email={privacyEmail} />
      </p>
    </Section>

    <Section title="2. Ámbito de aplicación">
      <p>Esta política se aplica al tratamiento de los datos personales realizado a través de:</p>
      <ul>
        <li>el sitio {MARKET.siteName}</li>
        <li>el cuestionario y las páginas de recogida de datos</li>
        <li>el checkout y las páginas de compra</li>
        <li>los posibles formularios de contacto</li>
        <li>el envío de correos operativos, contenidos semanales y comunicaciones de marketing</li>
        <li>el área de usuario eventualmente vinculada al servicio</li>
      </ul>
    </Section>

    <Section title="3. Tipos de datos tratados">
      <p>Podemos tratar las siguientes categorías de datos personales:</p>
      <SubSection title="a) Datos identificativos y de contacto">
        <ul>
          <li>nombre</li>
          <li>dirección de correo electrónico</li>
        </ul>
      </SubSection>
      <SubSection title="b) Datos facilitados para la prestación del servicio">
        <ul>
          <li>fecha de nacimiento</li>
          <li>hora de nacimiento</li>
          <li>lugar de nacimiento</li>
          <li>respuestas facilitadas en el cuestionario</li>
          <li>contenidos transmitidos mediante solicitudes de asistencia o formularios de contacto</li>
        </ul>
      </SubSection>
      <SubSection title="c) Datos relativos a las compras">
        <ul>
          <li>historial de compras</li>
          <li>información sobre el estado del pago</li>
          <li>identificadores de transacción facilitados por los proveedores de pago</li>
        </ul>
        <p className="text-sm text-muted-foreground italic mt-2">
          Nota: los datos completos de la tarjeta de pago no son tratados directamente por el Responsable, sino por los
          proveedores de pago utilizados.
        </p>
      </SubSection>
      <SubSection title="d) Datos técnicos y de navegación">
        <ul>
          <li>dirección IP</li>
          <li>registros técnicos (logs)</li>
          <li>información sobre navegador, dispositivo y sistema operativo</li>
          <li>datos recogidos mediante cookies o tecnologías similares</li>
        </ul>
      </SubSection>
      <SubSection title="e) Datos relativos a marketing y seguimiento">
        <ul>
          <li>datos recogidos mediante herramientas de analítica</li>
          <li>datos recogidos mediante cookies y píxeles de marketing, incluidas herramientas de remarketing</li>
        </ul>
      </SubSection>
    </Section>

    <Section title="4. Finalidades del tratamiento">
      <p>Los datos personales pueden tratarse para las siguientes finalidades:</p>
      <ul>
        <li>prestación del informe astrológico personalizado</li>
        <li>prestación de contenidos semanales, servicios recurrentes o suscripciones</li>
        <li>gestión de la cuenta de usuario, cuando esté disponible</li>
        <li>gestión del checkout, de los pagos y del historial de pedidos</li>
        <li>
          envío de comunicaciones operativas, como confirmaciones de pedido, acceso a los contenidos, asistencia y
          notificaciones de servicio
        </li>
        <li>gestión de las solicitudes enviadas por correo o formulario de contacto</li>
        <li>envío de newsletter y comunicaciones promocionales</li>
        <li>análisis estadísticos sobre el uso del sitio</li>
        <li>remarketing, retargeting y medición de las campañas publicitarias</li>
        <li>protección de la seguridad del sitio, prevención de abusos y gestión técnica de los sistemas</li>
      </ul>
    </Section>

    <Section title="5. Base jurídica del tratamiento">
      <p>El tratamiento de los datos personales se realiza, según los casos, sobre las siguientes bases jurídicas:</p>
      <ul>
        <li>
          <strong>ejecución de un contrato</strong> o de medidas precontractuales: para la prestación del informe, la
          gestión del cuestionario en cuanto funcional al servicio solicitado, la gestión de la cuenta, las compras, los
          pagos, el envío de correos operativos y la asistencia
        </li>
        <li>
          <strong>consentimiento del interesado</strong>: para el envío de newsletter y comunicaciones de marketing, así
          como para el uso de cookies y herramientas de seguimiento no técnicas cuando lo exija la normativa aplicable
        </li>
        <li>
          <strong>interés legítimo del Responsable</strong>: por necesidades de seguridad informática, defensa de sus
          derechos, prevención de fraudes, gestión técnica del sitio y análisis agregados del funcionamiento de los
          servicios, dentro de los límites permitidos por la ley
        </li>
      </ul>
    </Section>

    <Section title="6. Carácter de la aportación de datos">
      <p>La aportación de los datos marcados como necesarios es obligatoria cuando dichos datos sirven para:</p>
      <ul>
        <li>generar el informe solicitado</li>
        <li>gestionar una compra</li>
        <li>crear o administrar la cuenta</li>
        <li>prestar asistencia</li>
        <li>enviar comunicaciones operativas</li>
      </ul>
      <p>La falta de aportación de dichos datos puede hacer imposible la prestación del servicio.</p>
      <p>
        La aportación de datos con fines de marketing o para cookies no necesarias es, en cambio, facultativa. La
        eventual negativa no impide la navegación por el sitio ni la compra del servicio base, salvo los límites
        técnicos estrictamente necesarios.
      </p>
    </Section>

    <Section title="7. Modalidades del tratamiento">
      <p>
        El tratamiento se realiza con herramientas digitales y organizativas adecuadas a la naturaleza de los datos,
        según principios de licitud, lealtad, transparencia, minimización y limitación de la conservación.
      </p>
    </Section>

    <Section title="8. Destinatarios de los datos">
      <p>
        Los datos pueden comunicarse o hacerse accesibles a sujetos que actúan, según los casos, como encargados del
        tratamiento, responsables autónomos o personas autorizadas.
      </p>
      <p>En particular, los datos pueden tratarse a través de los siguientes proveedores o categorías de proveedores:</p>
      <ul>
        <li>proveedores de hosting e infraestructura/frontend</li>
        <li>Supabase para base de datos e infraestructura de la aplicación</li>
        <li>Stripe y PayPal para la gestión de los pagos</li>
        <li>Google para servicios tecnológicos y, cuando proceda, procesamiento mediante modelos de IA externos</li>
        <li>FreeAstroAPI para el procesamiento de los datos astrológicos necesarios para el servicio</li>
        <li>Meta para herramientas publicitarias, píxeles y remarketing</li>
        <li>Google Analytics para el análisis estadístico del tráfico del sitio</li>
        <li>proveedores de envío de correo, soporte técnico y gestión operativa vinculados a los servicios</li>
      </ul>
      <p>Los datos son tratados por dichos sujetos dentro de los límites necesarios para prestar sus servicios.</p>
    </Section>

    <Section title="9. Tratamiento mediante proveedores de IA y servicios externos">
      <p>
        Para prestar algunas funciones del servicio, los datos introducidos en el cuestionario y la información necesaria
        para la generación de los contenidos pueden enviarse a proveedores tecnológicos externos, incluidos servicios de
        IA de Google y servicios astrológicos externos.
      </p>
      <p>
        El Responsable aplica un criterio de minimización: solo se transmiten a los proveedores externos los datos
        necesarios para generar el contenido solicitado o ejecutar la función técnica prevista.
      </p>
    </Section>

    <Section title="10. Transferencia de datos a países fuera del EEE">
      <p>
        Algunos proveedores tecnológicos utilizados pueden encontrarse o tratar datos en países fuera del Espacio
        Económico Europeo, incluidos los Estados Unidos u otros países terceros.
      </p>
      <p>
        Cuando proceda, dichas transferencias se realizan respetando los instrumentos previstos por la normativa vigente,
        incluidos eventuales mecanismos contractuales u otras garantías exigidas por la ley.
      </p>
      <p>
        Para más información sobre las transferencias eventualmente realizadas y sus garantías, el usuario puede escribir
        a <MailLink email={privacyEmail} />.
      </p>
    </Section>

    <Section title="11. Plazo de conservación de los datos">
      <p>
        Salvo obligaciones legales distintas, los datos personales se conservan durante un plazo no superior al
        necesario para las finalidades para las que se recogieron.
      </p>
      <p>Con carácter general:</p>
      <ul>
        <li>
          los datos relativos a solicitudes de contacto pueden conservarse durante el tiempo necesario para gestionar la
          solicitud y durante un periodo administrativo posterior razonable
        </li>
        <li>
          los datos relativos a las compras y a la relación contractual pueden conservarse durante la duración de la
          relación y posteriormente durante el tiempo necesario para cumplir obligaciones fiscales, administrativas o de
          defensa
        </li>
        <li>
          los datos utilizados para comunicaciones de marketing se conservan hasta la revocación del consentimiento u
          oposición del interesado
        </li>
        <li>
          los datos técnicos y de registro se conservan durante el periodo estrictamente necesario para garantizar el
          funcionamiento, la seguridad y el análisis de los sistemas
        </li>
        <li>
          los datos vinculados a analítica y cookies dependen de la configuración de la herramienta correspondiente y de
          las preferencias expresadas por el usuario
        </li>
      </ul>
    </Section>

    <Section title="12. Política de Cookies">
      <p>
        Este sitio utiliza cookies y tecnologías similares para garantizar el correcto funcionamiento de las páginas,
        analizar el tráfico, mejorar la experiencia de usuario y, previo consentimiento cuando sea necesario, medir las
        campañas publicitarias y realizar actividades de remarketing.
      </p>
      <SubSection title="12.1 Qué son las cookies">
        <p>
          Las cookies son pequeños archivos de texto que los sitios web envían al dispositivo del usuario durante la
          navegación. Pueden almacenarse y luego retransmitirse a los mismos sitios en la visita siguiente.
        </p>
        <p>
          Tecnologías similares, como píxeles, etiquetas, scripts o identificadores, pueden cumplir funciones análogas de
          recogida o transmisión de información.
        </p>
      </SubSection>
      <SubSection title="12.2 Tipos de cookies utilizadas">
        <p>El sitio puede utilizar las siguientes categorías de cookies:</p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">a) Cookies técnicas o estrictamente necesarias</h4>
        <p>Sirven para permitir el funcionamiento del sitio y la prestación de las funciones esenciales, por ejemplo:</p>
        <ul>
          <li>navegación entre páginas</li>
          <li>gestión de la sesión</li>
          <li>seguridad del sitio</li>
          <li>memorización de las preferencias técnicas</li>
          <li>correcto funcionamiento del checkout o de componentes esenciales</li>
        </ul>
        <p>Estas cookies no requieren normalmente el consentimiento del usuario.</p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">b) Cookies de analítica</h4>
        <p>Sirven para recoger información estadística sobre el uso del sitio, por ejemplo:</p>
        <ul>
          <li>número de visitantes</li>
          <li>páginas visitadas</li>
          <li>procedencia del tráfico</li>
          <li>comportamiento de navegación</li>
          <li>rendimiento de las páginas</li>
        </ul>
        <p>
          El sitio puede utilizar herramientas de analítica como Google Analytics. Cuando dichas herramientas no estén
          configuradas de forma estrictamente agregada o anonimizada según los estándares exigidos por la normativa
          aplicable, su uso puede requerir el consentimiento del usuario.
        </p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">c) Cookies de marketing, perfilado y remarketing</h4>
        <p>Sirven para:</p>
        <ul>
          <li>medir la eficacia de las campañas publicitarias</li>
          <li>crear públicos personalizados</li>
          <li>mostrar anuncios coherentes con el comportamiento de navegación</li>
          <li>realizar remarketing y retargeting</li>
        </ul>
        <p>
          Esta categoría puede incluir herramientas como Meta Pixel y otros scripts o etiquetas publicitarias. Dichas
          cookies no son necesarias para el funcionamiento del sitio y solo se utilizan sobre la base del consentimiento,
          cuando lo exija la normativa aplicable.
        </p>
      </SubSection>
      <SubSection title="12.3 Cookies de origen y de terceros">
        <p>El sitio puede utilizar:</p>
        <ul>
          <li>cookies de origen, instaladas directamente por el sitio</li>
          <li>
            cookies de terceros, instaladas mediante servicios facilitados por sujetos externos como Google, Meta,
            Stripe, PayPal u otros proveedores técnicos
          </li>
        </ul>
        <p>
          La información recogida por cookies de terceros se rige también por las políticas de los respectivos
          proveedores.
        </p>
      </SubSection>
      <SubSection title="12.4 Base jurídica para el uso de cookies">
        <p>El uso de cookies técnicas se basa en la necesidad de prestar el sitio y los servicios solicitados.</p>
        <p>
          El uso de cookies de analítica no estrictamente técnicas, cookies de marketing, píxeles, etiquetas u otras
          herramientas de seguimiento se basa en el consentimiento del usuario, cuando lo exija la normativa aplicable.
        </p>
      </SubSection>
      <SubSection title="12.5 Gestión del consentimiento">
        <p>Cuando se requiera, en el primer acceso al sitio el usuario puede:</p>
        <ul>
          <li>aceptar todas las cookies no necesarias</li>
          <li>rechazar las cookies no necesarias</li>
          <li>seleccionar sus preferencias</li>
        </ul>
        <p>
          El usuario puede en cualquier momento modificar o revocar sus preferencias mediante las herramientas
          disponibles en el sitio, si las hubiera, o mediante la configuración del navegador, teniendo en cuenta que el
          bloqueo de algunas cookies puede afectar al funcionamiento de algunas funciones no esenciales.
        </p>
      </SubSection>
      <SubSection title="12.6 Desactivación mediante el navegador">
        <p>
          El usuario también puede gestionar o desactivar las cookies a través de la configuración de su navegador. No
          obstante, la desactivación de las cookies técnicas podría comprometer el correcto funcionamiento del sitio o de
          algunas de sus partes.
        </p>
      </SubSection>
      <SubSection title="12.7 Conservación de las cookies">
        <p>La duración de las cookies puede variar:</p>
        <ul>
          <li>algunas se eliminan automáticamente al cerrar el navegador</li>
          <li>
            otras permanecen almacenadas durante un periodo más largo, definido por cada proveedor o por la configuración
            técnica del sitio
          </li>
        </ul>
        <p>
          La duración efectiva puede depender también de las políticas del navegador, de las preferencias del usuario y
          de los proveedores terceros utilizados.
        </p>
      </SubSection>
    </Section>

    <Section title="13. Derechos del interesado">
      <p>En los casos previstos por la normativa aplicable, el interesado puede ejercer los derechos de:</p>
      <ul>
        <li>acceso a los datos personales</li>
        <li>rectificación de los datos inexactos</li>
        <li>supresión de los datos</li>
        <li>limitación del tratamiento</li>
        <li>oposición al tratamiento, en los casos previstos</li>
        <li>portabilidad de los datos, cuando proceda</li>
        <li>
          revocación del consentimiento en cualquier momento, sin perjuicio de la licitud del tratamiento basado en el
          consentimiento prestado antes de la revocación
        </li>
        <li>presentar una reclamación ante la autoridad de control competente</li>
      </ul>
      <p>
        Para ejercer sus derechos, el usuario puede escribir a: <MailLink email={privacyEmail} />
      </p>
    </Section>

    <Section title="14. Menores">
      <p>
        El servicio no está destinado a personas menores de edad. El Responsable invita a no utilizar el sitio y a no
        transmitir datos personales si no se es mayor de edad o, en cualquier caso, si no se tiene la capacidad de
        prestar válidamente el consentimiento según la normativa aplicable.
      </p>
    </Section>

    <Section title="15. Modificaciones de esta política">
      <p>
        El Responsable se reserva el derecho de actualizar o modificar esta política en cualquier momento. La versión
        actualizada se publicará en esta página con indicación de la fecha de la última actualización.
      </p>
    </Section>
  </LegalPage>
);

export default PrivacyPolicyEs;
