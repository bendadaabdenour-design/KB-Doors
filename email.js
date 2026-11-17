/*
 * Email notifications for orders and quote requests, sent through FormSubmit.
 * This script must never prevent the storefront's own actions from running.
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

    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(config.recipient)}`, {
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
      throw new Error(result.message || result.error || responseText || 'Échec de l’envoi du courriel.');
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

  // Keep the cart action working even if optional email details cannot be read.
  const originalAddToCart = window.addToCart;
  if (typeof originalAddToCart === 'function') {
    window.addToCart = function addToCartWithFullDetails() {
      const result = originalAddToCart.apply(this, arguments);
      try {
        const item = state.cart[state.cart.length - 1];
        if (item) {
          item.handle = state.config?.handle || item.handle;
          item.frame = state.config?.frame || item.frame;
          if (typeof saveCart === 'function') saveCart();
        }
      } catch (error) {
        console.warn('Détails optionnels de la commande indisponibles :', error);
      }
      return result;
    };
  }

  const originalSubmitOrder = window.submitOrder;
  if (typeof originalSubmitOrder === 'function') {
    window.submitOrder = async function submitOrderAndEmail(totalAmount) {
      let order = null;
      try {
        order = {
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
      } catch (error) {
        console.warn('Impossible de préparer les détails e-mail de la commande :', error);
      }

      // Run the shop's original order flow first; email is only an additional notice.
      const result = await originalSubmitOrder.apply(this, arguments);
      if (!order) return result;

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
      return result;
    };
  }

  const originalSubmitContact = window.submitContact;
  if (typeof originalSubmitContact === 'function') {
    window.submitContact = async function submitContactAndEmail() {
      let contact = null;
      try {
        contact = {
          name: document.getElementById('contact-name')?.value.trim() || '',
          phone: document.getElementById('contact-phone')?.value.trim() || '',
          wilaya: document.getElementById('contact-wilaya')?.value || '',
          message: document.getElementById('contact-msg')?.value.trim() || ''
        };
        const isConfiguredQuote = Boolean(state.prefillContact);
        contact.quoteItems = isConfiguredQuote ? [{
          productName: state.selectedProduct?.name,
          qty: state.config?.qty,
          unitPrice: calculateConfigTotal().unitPrice,
          color: state.config?.color?.name,
          dimension: state.config?.dimension?.label,
          opening: state.config?.opening,
          handle: state.config?.handle,
          frame: state.config?.frame
        }] : [];
      } catch (error) {
        console.warn('Impossible de préparer les détails e-mail du devis :', error);
      }

      const result = await originalSubmitContact.apply(this, arguments);
      if (!contact || !contact.name || !contact.phone || !contact.message) return result;

      try {
        const items = contact.quoteItems.length
          ? contact.quoteItems.map(itemDetails).join('\n\n')
          : 'Articles/quantités : détaillés dans le message du client.';
        const body = [
          'Nouvelle demande de devis',
          `Client : ${contact.name}`,
          `Téléphone : ${contact.phone}`,
          `Wilaya : ${contact.wilaya}`,
          '',
          'ARTICLES ET QUANTITÉS :',
          items,
          '',
          'MESSAGE / DÉTAILS DU PROJET :',
          contact.message
        ].join('\n');
        await sendEmail(`Demande de devis KBDOOR — ${contact.name || 'Client'}`, body, 'devis');
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
      return result;
    };
  }
})();
