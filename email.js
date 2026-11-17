/*
 * Email notifications for orders and quote requests, sent through FormSubmit.
 * The recipient address is public in client-side code; use FormSubmit's
 * activation and spam protections, and do not put private credentials here.
 */
window.KBDOOR_EMAIL_CONFIG = window.KBDOOR_EMAIL_CONFIG || {
  recipient: 'bendadaabdenour@gmail.com'
};

(function installEmailNotifications() {
  const config = window.KBDOOR_EMAIL_CONFIG;

  function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('fr-DZ') + ' DA';
  }

  function itemDetails(item, index) {
    const quantity = Number(item.qty) || 0;
    const lineTotal = (Number(item.unitPrice) || 0) * quantity;
    return [
      `${index + 1}. ${item.productName || 'Article'}`,
      `   Quantité : ${quantity}`,
      `   Prix unitaire : ${formatMoney(item.unitPrice)}`,
      `   Total ligne : ${formatMoney(lineTotal)}`,
      `   Finition : ${item.color || 'Non précisée'}`,
      `   Dimensions : ${item.dimension || 'Non précisées'}`,
      `   Sens d’ouverture : ${item.opening || 'Non précisé'}`,
      `   Quincaillerie : ${item.handle || 'Non précisée'}`,
      `   Cadre : ${item.frame || 'Non précisé'}`
    ].join('\n');
  }

  async function sendEmail(subject, message, type) {
    if (!config.recipient) {
      throw new Error('Adresse destinataire FormSubmit manquante dans email.js.');
    }

    const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(config.recipient)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: subject,
        message,
        type
      })
    });

    const responseText = await response.text().catch(() => '');
    let result = {};
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      result = { message: responseText };
    }

    if (!response.ok || result.success === false || result.success === 'false') {
      const reason = result.message || result.error || responseText || 'Échec de l’envoi du courriel.';
      throw new Error(reason);
    }
  }

  function showOrderEmailStatus(message, success) {
    const confirmation = document.querySelector('#app-content .max-w-xl');
    if (!confirmation) return;
    const notice = document.createElement('p');
    notice.className = `mt-4 text-sm ${success ? 'text-emerald-700' : 'text-amber-700'}`;
    notice.textContent = message;
    confirmation.appendChild(notice);
  }

  const originalAddToCart = window.addToCart;
  if (typeof originalAddToCart === 'function') {
    window.addToCart = function addToCartWithFullDetails() {
      const options = {
        handle: state.config.handle,
        frame: state.config.frame
      };
      originalAddToCart.apply(this, arguments);
      const item = state.cart[state.cart.length - 1];
      if (item) Object.assign(item, options);
      saveCart();
    };
  }

  const originalSubmitOrder = window.submitOrder;
  if (typeof originalSubmitOrder === 'function') {
    window.submitOrder = async function submitOrderAndEmail(totalAmount) {
      const order = {
        id: 'CMD-' + Math.floor(100000 + Math.random() * 900000),
        client: document.getElementById('order-name')?.value.trim() || '',
        phone: document.getElementById('order-phone')?.value.trim() || '',
        address: document.getElementById('order-address')?.value.trim() || '',
        wilaya: state.selectedWilaya?.name || '',
        shipping: Number(state.selectedWilaya?.fee) || 0,
        payment: state.paymentMethod || '',
        total: Number(totalAmount) || 0,
        items: state.cart.map(item => ({ ...item }))
      };

      await originalSubmitOrder.apply(this, arguments);

      try {
        const itemList = order.items.map(itemDetails).join('\n\n');
        const body = [
          `Commande : ${order.id}`,
          `Client : ${order.client}`,
          `Téléphone : ${order.phone}`,
          `Adresse : ${order.address}`,
          `Wilaya : ${order.wilaya}`,
          `Mode de paiement : ${order.payment}`,
          '',
          'ARTICLES :',
          itemList || 'Aucun article',
          '',
          `Livraison : ${formatMoney(order.shipping)}`,
          `Total commande : ${formatMoney(order.total)}`
        ].join('\n');
        await sendEmail(`Nouvelle commande KBDOOR ${order.id}`, body, 'commande');
        showOrderEmailStatus('Notification de commande envoyée par e-mail.', true);
      } catch (error) {
        console.error('Notification e-mail de commande impossible :', error);
        showOrderEmailStatus('La commande est enregistrée, mais la notification e-mail n’a pas pu être envoyée. Contactez-nous par téléphone.', false);
      }
    };
  }

  const originalSubmitContact = window.submitContact;
  if (typeof originalSubmitContact === 'function') {
    window.submitContact = async function submitContactAndEmail() {
      const name = document.getElementById('contact-name')?.value.trim() || '';
      const phone = document.getElementById('contact-phone')?.value.trim() || '';
      const wilaya = document.getElementById('contact-wilaya')?.value || '';
      const message = document.getElementById('contact-msg')?.value.trim() || '';
      const isConfiguredQuote = Boolean(state.prefillContact);
      const quoteItems = isConfiguredQuote ? [{
        productName: state.selectedProduct?.name,
        qty: state.config?.qty,
        unitPrice: calculateConfigTotal().unitPrice,
        color: state.config?.color?.name,
        dimension: state.config?.dimension?.label,
        opening: state.config?.opening,
        handle: state.config?.handle,
        frame: state.config?.frame
      }] : [];

      await originalSubmitContact.apply(this, arguments);

      try {
        const items = quoteItems.length ? quoteItems.map(itemDetails).join('\n\n') : 'Articles/quantités : détaillés dans le message du client.';
        const body = [
          'Nouvelle demande de devis',
          `Client : ${name}`,
          `Téléphone : ${phone}`,
          `Wilaya : ${wilaya}`,
          '',
          'ARTICLES ET QUANTITÉS :',
          items,
          '',
          'MESSAGE / DÉTAILS DU PROJET :',
          message
        ].join('\n');
        await sendEmail(`Demande de devis KBDOOR — ${name || 'Client'}`, body, 'devis');
        const feedback = document.getElementById('contact-feedback');
        if (feedback) feedback.textContent = 'Votre demande a bien été enregistrée et envoyée par e-mail à notre équipe.';
      } catch (error) {
        console.error('Notification e-mail de devis impossible :', error);
        const feedback = document.getElementById('contact-feedback');
        if (feedback) {
          feedback.textContent = 'Votre demande est enregistrée, mais la notification e-mail n’a pas pu être envoyée. Contactez-nous par téléphone.';
          feedback.classList.remove('text-emerald-700');
          feedback.classList.add('text-amber-700');
        }
      }
    };
  }
})();
