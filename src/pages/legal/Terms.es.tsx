// ⚠️ Traducción borrador pendiente de revisión legal antes del lanzamiento.
import { MARKET } from "@/markets";
import { LegalPage, LegalEntityBox, Section, MailLink, SiteLink, infoEmail } from "./LegalLayout";

const TermsEs = () => (
  <LegalPage
    seoTitle={`Términos y Condiciones — ${MARKET.siteName}`}
    seoDescription={`Términos y Condiciones de uso del sitio ${MARKET.siteName} y de los servicios digitales ofrecidos.`}
    path="/termini"
    backAria="Atrás"
    heading="Términos y Condiciones"
    lastUpdated="Última actualización: 24 de abril de 2026"
  >
    <p className="text-base leading-relaxed text-foreground/90 mb-4">
      Estos Términos y Condiciones regulan el acceso y el uso del sitio <SiteLink /> y la compra de los servicios
      digitales ofrecidos a través de la marca {MARKET.siteName}.
    </p>
    <p className="text-base leading-relaxed text-foreground/90 mb-10">
      Al acceder al sitio o comprar uno o más servicios, el usuario declara haber leído, comprendido y aceptado estos
      Términos y Condiciones.
    </p>

    <Section title="1. Titular del servicio">
      <p>El servicio es ofrecido por:</p>
      <LegalEntityBox />
      <p>
        Marca comercial utilizada en el sitio: <strong>{MARKET.siteName}</strong>
      </p>
      <p>
        Contacto: <MailLink email={infoEmail} />
      </p>
    </Section>

    <Section title="2. Objeto del servicio">
      <p>
        {MARKET.siteName} ofrece servicios digitales de pago basados en elaboraciones personalizadas, contenidos
        astrológicos interpretativos y funcionalidades accesorias conexas.
      </p>
      <p>Los servicios pueden incluir, según la oferta comprada:</p>
      <ul>
        <li>informes astrológicos personalizados</li>
        <li>contenidos semanales o periódicos</li>
        <li>acceso a un área de usuario</li>
        <li>posibles contenidos extra</li>
        <li>posibles funcionalidades digitales adicionales vinculadas al servicio comprado</li>
      </ul>
      <p>
        Salvo indicación distinta, los servicios se prestan exclusivamente en formato digital y no prevén la entrega de
        bienes materiales.
      </p>
    </Section>

    <Section title="3. Naturaleza del servicio">
      <p>
        El servicio prestado por {MARKET.siteName} tiene finalidad informativa, introspectiva y de entretenimiento
        evolucionado.
      </p>
      <p>El contenido facilitado:</p>
      <ul>
        <li>no constituye asesoramiento psicológico, psiquiátrico ni médico</li>
        <li>no constituye asesoramiento legal, fiscal ni financiero</li>
        <li>no garantiza resultados personales, relacionales, profesionales ni económicos</li>
        <li>no sustituye el juicio personal del usuario ni el apoyo de profesionales cualificados</li>
      </ul>
      <p>El usuario es el único responsable del uso que decida hacer de los contenidos recibidos.</p>
    </Section>

    <Section title="4. Requisitos del usuario">
      <p>Para utilizar el sitio o comprar los servicios, el usuario declara:</p>
      <ul>
        <li>ser mayor de edad o, en cualquier caso, legalmente capaz de celebrar un contrato vinculante</li>
        <li>facilitar datos veraces, exactos y completos</li>
        <li>utilizar el sitio de forma lícita y conforme a estos Términos</li>
      </ul>
      <p>El servicio no está destinado a menores.</p>
    </Section>

    <Section title="5. Datos facilitados por el usuario">
      <p>
        Para la prestación del servicio, el usuario puede tener que facilitar datos personales e información necesaria
        para la personalización del contenido, incluidos, a título de ejemplo:
      </p>
      <ul>
        <li>nombre</li>
        <li>correo electrónico</li>
        <li>fecha de nacimiento</li>
        <li>hora de nacimiento</li>
        <li>lugar de nacimiento</li>
        <li>respuestas al cuestionario o a otros formularios</li>
      </ul>
      <p>El usuario es responsable de la exactitud de los datos introducidos.</p>
      <p>
        {MARKET.siteName} no responde de errores, retrasos, contenidos inexactos o resultados no coherentes derivados de
        datos incompletos, erróneos o no actualizados facilitados por el usuario.
      </p>
    </Section>

    <Section title="6. Modalidad de compra">
      <p>La compra se realiza a través del sitio, según el flujo de checkout disponible en el momento del pedido.</p>
      <p>Antes de la conclusión de la compra, el usuario puede visualizar al menos:</p>
      <ul>
        <li>las características principales del servicio comprado</li>
        <li>el precio total</li>
        <li>los elementos incluidos en la oferta</li>
        <li>las modalidades de pago</li>
        <li>la información esencial sobre desistimiento y entrega digital, cuando proceda</li>
      </ul>
      <p>
        El contrato se considera concluido cuando el pago ha sido correctamente autorizado y el pedido ha sido confirmado
        por el sistema o por el Titular.
      </p>
    </Section>

    <Section title="7. Precios y pagos">
      <p>Todos los precios publicados en el sitio se expresan en la moneda indicada en la página de compra.</p>
      <p>Los pagos pueden gestionarse a través de proveedores terceros, incluidos:</p>
      <ul>
        <li>Stripe</li>
        <li>PayPal</li>
      </ul>
      <p>
        {MARKET.siteName} no trata directamente los datos completos de la tarjeta de pago. Dichos datos son tratados por
        los proveedores de pago según sus respectivas condiciones y políticas de privacidad.
      </p>
      <p>
        El Titular se reserva el derecho de modificar precios, ofertas, paquetes o condiciones comerciales en cualquier
        momento. Las modificaciones no se aplican a los pedidos ya concluidos.
      </p>
    </Section>

    <Section title="8. Entrega de los contenidos digitales">
      <p>Los servicios comprados se prestan en formato digital, mediante una o varias de las siguientes modalidades:</p>
      <ul>
        <li>visualización en la página</li>
        <li>envío por correo electrónico</li>
        <li>acceso a través del área de usuario</li>
        <li>activación de contenidos periódicos vinculados al perfil del usuario</li>
      </ul>
      <p>
        Los plazos de prestación pueden variar según la naturaleza del servicio, la carga técnica, la exactitud de los
        datos facilitados y la eventual necesidad de elaboraciones automatizadas o integraciones con servicios terceros.
      </p>
      <p>
        Salvo indicación distinta, el Titular no garantiza la prestación inmediata en tiempo real, pero se compromete a
        prestar el servicio dentro de un plazo razonable compatible con la estructura técnica del producto.
      </p>
    </Section>

    <Section title="9. Cuenta de usuario">
      <p>
        Si el servicio prevé la creación de una cuenta, el usuario es responsable de la confidencialidad de las
        credenciales de acceso y de toda actividad realizada a través de su cuenta.
      </p>
      <p>El usuario se compromete a:</p>
      <ul>
        <li>no compartir las credenciales con terceros</li>
        <li>no usar cuentas ajenas</li>
        <li>comunicar de inmediato cualquier acceso no autorizado o violación de seguridad</li>
      </ul>
      <p>
        El Titular se reserva el derecho de suspender o limitar el acceso en caso de uso indebido, sospecha de fraude,
        violación de estos Términos o conductas que puedan comprometer el correcto funcionamiento del servicio.
      </p>
    </Section>

    <Section title="10. Derecho de desistimiento">
      <p>
        Si el usuario compra en calidad de consumidor, puede beneficiarse del derecho de desistimiento en los casos
        previstos por la ley.
      </p>
      <p>
        Con carácter general, para los contratos celebrados a distancia el derecho de desistimiento es de 14 días. No
        obstante, para los contenidos digitales prestados en soporte no material, el derecho de desistimiento puede
        excluirse cuando:
      </p>
      <ul>
        <li>la ejecución se ha iniciado durante el periodo de desistimiento</li>
        <li>el usuario ha prestado su consentimiento expreso previo</li>
        <li>el usuario ha reconocido perder el derecho de desistimiento</li>
        <li>el profesional ha facilitado la confirmación del contrato según las modalidades exigidas por la ley</li>
      </ul>
      <p>
        En consecuencia, en caso de que el usuario solicite o acepte la activación inmediata del servicio digital
        personalizado, de la generación del informe o de la puesta a disposición inmediata del contenido digital, el
        usuario acepta que la ejecución comience antes del vencimiento del plazo de desistimiento y, dentro de los
        límites legales, reconoce poder perder dicho derecho una vez iniciada la ejecución del servicio.
      </p>
    </Section>

    <Section title="11. Reembolso">
      <p>
        Para los supuestos de desistimiento legal se remite a la Sección 10 anterior. Fuera de dichos supuestos y salvo
        lo previsto por la ley, los servicios digitales ya prestados, activados, personalizados o puestos a disposición
        del usuario no son, por regla general, reembolsables.
      </p>
      <p>
        <strong>Garantía comercial "satisfecho o reembolsado" (14 días).</strong> Además de los derechos reconocidos por
        la ley, el Titular ofrece una garantía comercial voluntaria: si dentro de los 14 días siguientes a la entrega del
        informe el usuario considera que la lectura es genérica o no se corresponde con los datos de nacimiento
        facilitados, puede solicitar el reembolso íntegro del importe pagado escribiendo a <MailLink email={infoEmail} />{" "}
        desde la dirección de correo utilizada para la compra.
      </p>
      <p>
        El reembolso, una vez reconocido, se efectúa con el mismo método de pago utilizado para la compra, sin coste para
        el usuario. La garantía se prevé una sola vez por cliente y se refiere exclusivamente a la compra inicial de la
        Lectura de la Carta Natal (también en la variante que incluye el primer mes de Tránsitos). Las renovaciones
        sucesivas de la suscripción de Tránsitos no entran en la garantía y se rigen por la Sección 12 siguiente.
      </p>
      <p>
        Cualquier otra solicitud de asistencia o reclamación puede enviarse a la misma dirección o a los datos de
        contacto indicados en el sitio. El Titular valorará de buena fe eventuales anomalías técnicas, duplicaciones de
        pago o falta de prestación efectiva del servicio.
      </p>
    </Section>

    <Section title="12. Suscripciones y contenidos recurrentes">
      <p>Si el servicio comprado incluye contenidos periódicos, accesos recurrentes o formas de suscripción:</p>
      <ul>
        <li>la periodicidad, el precio y las características esenciales se indicarán en la página de oferta correspondiente</li>
        <li>el usuario es responsable de verificar la naturaleza recurrente de la compra antes de confirmar el pedido</li>
        <li>
          el Titular puede suspender o interrumpir el servicio en caso de impago o imposibilidad técnica sobrevenida
        </li>
      </ul>
      <p>
        Si un plan recurrente está previsto como renovación automática, ello debe indicarse claramente en el checkout o en
        la página de oferta antes de la compra.
      </p>
    </Section>

    <Section title="13. Uso permitido del servicio">
      <p>
        El usuario puede utilizar los contenidos comprados solo para fines personales y no comerciales, salvo acuerdo
        escrito distinto.
      </p>
      <p>Queda prohibido:</p>
      <ul>
        <li>copiar, reproducir, distribuir o revender los contenidos</li>
        <li>compartir públicamente informes, materiales, resultados, flujos o áreas reservadas de forma sistemática</li>
        <li>utilizar el servicio para fines ilícitos, fraudulentos o lesivos de derechos de terceros</li>
        <li>intentar eludir limitaciones técnicas, de seguridad o de acceso</li>
      </ul>
    </Section>

    <Section title="14. Propiedad intelectual">
      <p>
        Todos los contenidos presentes en el sitio y facilitados a través del servicio, incluidos textos, estructura del
        producto, materiales, interfaces, elementos gráficos, logotipos, nombres comerciales, resultados organizados,
        diseño y contenidos editoriales, están reservados al Titular o a sus respectivos titulares de derechos.
      </p>
      <p>
        La compra del servicio no transfiere al usuario ningún derecho de propiedad intelectual sobre el sitio o los
        contenidos, salvo el derecho personal y limitado de disfrute del servicio comprado.
      </p>
    </Section>

    <Section title="15. Disponibilidad del servicio">
      <p>
        El Titular se compromete a mantener el sitio y los servicios razonablemente disponibles, pero no garantiza que
        sean siempre accesibles sin interrupciones, errores, retrasos o fallos.
      </p>
      <p>El servicio puede suspenderse, limitarse o interrumpirse por:</p>
      <ul>
        <li>mantenimiento</li>
        <li>actualizaciones técnicas</li>
        <li>problemas de red o infraestructura</li>
        <li>eventos fuera del control razonable del Titular</li>
        <li>indisponibilidad de proveedores terceros esenciales</li>
      </ul>
    </Section>

    <Section title="16. Limitación de responsabilidad">
      <p>Dentro de los límites permitidos por la ley, el Titular no será responsable de:</p>
      <ul>
        <li>decisiones personales, relacionales o profesionales adoptadas por el usuario sobre la base de los contenidos recibidos</li>
        <li>pérdidas indirectas, oportunidades perdidas o daños imprevisibles</li>
        <li>errores derivados de datos inexactos facilitados por el usuario</li>
        <li>
          interrupciones o fallos imputables a proveedores terceros, herramientas externas, servicios de IA, pasarelas de
          pago o redes de telecomunicaciones
        </li>
        <li>incompatibilidades temporales con dispositivos, navegadores o configuraciones técnicas del usuario</li>
      </ul>
      <p>
        Queda a salvo la eventual responsabilidad inderogable prevista por la normativa aplicable en protección del
        consumidor.
      </p>
    </Section>

    <Section title="17. Privacidad y datos personales">
      <p>
        El tratamiento de los datos personales del usuario se rige por la{" "}
        <a href="/privacy" className="text-primary underline-offset-4 hover:underline">
          Política de Privacidad y Cookies
        </a>{" "}
        publicada en el sitio, que constituye parte integrante de la relación contractual en lo que resulte compatible.
      </p>
    </Section>

    <Section title="18. Modificaciones de los Términos">
      <p>El Titular puede actualizar o modificar estos Términos y Condiciones en cualquier momento.</p>
      <p>
        Las modificaciones surtirán efecto desde la fecha de publicación en el sitio, salvo que se indique lo contrario.
        Para los pedidos ya concluidos seguirán siendo aplicables, por regla general, los términos vigentes en el momento
        de la compra.
      </p>
    </Section>

    <Section title="19. Ley aplicable y fuero">
      <p>
        Estos Términos y Condiciones se rigen por la ley aplicable determinada según las normas de derecho internacional
        privado y, cuando proceda, por las normas imperativas de protección del consumidor.
      </p>
      <p>
        Si el usuario actúa en calidad de consumidor, quedan a salvo los derechos eventualmente reconocidos por las
        normas imperativas del país de residencia habitual del consumidor.
      </p>
      <p>
        Para cualquier controversia relativa a la interpretación, validez o ejecución de estos Términos, si el usuario es
        consumidor será competente el fuero eventualmente previsto como inderogable por la normativa aplicable.
      </p>
    </Section>

    <Section title="20. Contacto">
      <p>
        Para información, asistencia o comunicaciones relativas a estos Términos: <MailLink email={infoEmail} />
      </p>
    </Section>
  </LegalPage>
);

export default TermsEs;
