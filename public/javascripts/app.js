const App = {
  compileTemplates() {
    this.formTemplate = Handlebars.compile($('#form_template').html());
    this.contactTemplate = Handlebars.compile($('#contact_template').html());
    Handlebars.registerPartial('contact', $('#contact_template').html());
    this.contactsTemplate = Handlebars.compile($('#contacts_template').html());
    this.filterMessageTemplate = Handlebars.compile($('#filter_message_template').html());
  },
  areValidInputs() {
    return true;
  },
  createJSON(form) {
    let obj = {};
    const data = new FormData(form);
    data.forEach((value, key) => {
      obj[key] = value;
    });

    return JSON.stringify(obj);
  },
  handleAddForm(e) {
    e.preventDefault();

    $('main').append(this.createFormHTML);
    $('#home_container').slideUp(this.ANIMATION_DELAY);
    $('#create_contact').slideDown(this.ANIMATION_DELAY, () => {
      $('main').append($('#home_container'));
    });
  },
  handleClosingForm(e) {
    e.preventDefault();
    $('form').slideUp(this.ANIMATION_DELAY);
    $('#home_container').slideDown(this.ANIMATION_DELAY, () => {
      $('form').remove();
    });
  },
  createContact(form) {
    const json = this.createJSON(form);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/contacts');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';

    xhr.addEventListener('load', e => {
      if (xhr.status === 201) {
        const contact = xhr.response;
        contact.tags = contact.tags.split(',');
        this.contacts.push(contact);
        this.renderHomePage(this.contacts);
        this.handleClosingForm(e);
      }
    });

    xhr.send(json);
  },
  handleCreatingContact(e) {
    e.preventDefault();
    const form = e.currentTarget;

    if (this.areValidInputs()) {
      this.createContact(form);
      form.reset();
    }
  },
  handleUpdatingContact(e) {
    e.preventDefault();
    const form = e.currentTarget;

    if (this.areValidInputs()) {
      this.updateContact(form);
      form.reset();
    }
  },
  updateContact(form) {
    const json = this.createJSON(form);
    const xhr = new XMLHttpRequest();
    const id = $(form).attr('data-id');
    const contact = this.contacts.filter(contact => { return contact.id === parseInt(id, 10) })[0];
    xhr.open('PUT', '/api/contacts/' + id);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';

    xhr.addEventListener('load', e => {
      if (xhr.status === 201) {
        const updatedContact = xhr.response;
        updatedContact.tags = updatedContact.tags.split(',');
        this.contacts.splice(this.contacts.indexOf(contact), 1, updatedContact);
        this.renderHomePage(this.contacts);
        this.handleClosingForm(e);
      }
    });

    xhr.send(json);
  },
  handleEditForm(e) {
    e.preventDefault();
    let url = $(e.currentTarget).attr('href').split('/');
    const id = parseInt(url[url.length - 1], 10);
    const contact = this.contacts.filter(contact => { return contact.id === id })[0];
    contact.purpose = 'update';

    $('main').append(this.formTemplate(contact));
    $('#home_container').slideToggle(this.ANIMATION_DELAY);
    $('#update_contact').slideToggle(this.ANIMATION_DELAY);
    $('#home_container').after($('#update_contact'));
  },
  deleteContact(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('DELETE', url);

    xhr.addEventListener('load', e => {
      if (xhr.status === 204) {
        url = url.split('/');
        const id = parseInt(url[url.length -1], 10);
        this.contacts = this.contacts.filter(contact => { return contact.id !== id });
        this.renderHomePage(this.contacts);
      }
    });

    xhr.send();
  },
  handleDeleting(e) {
    e.preventDefault();
    const url = $(e.currentTarget).attr('href');

    if (confirm('Do you want to delete the contact?')) {
      this.deleteContact(url);
    }
  },
  filterContacts(tag) {
    const contacts = this.contacts.filter(contact => {
      return contact.tags.indexOf(tag) > -1;
    });


    $('#filter_message').remove();
    $('#search_container').after(this.filterMessageTemplate({ tag: tag }));
    this.renderHomePage(contacts);
  },
  handleFiltering(e) {
    e.preventDefault();
    const tag = $(e.currentTarget).attr('data-tag');

    this.filterContacts(tag);
  },
  handleUnfiltering(e) {
    e.preventDefault();
    $(e.currentTarget).closest('#filter_message').remove();
    this.renderHomePage(this.contacts);
  },
  handleSearching(e) {
    const input = e.currentTarget.value;

    const contacts = this.contacts.filter(contact => {
      return contact.full_name.toLowerCase().includes(input.toLowerCase());
    });

    this.renderHomePage(contacts);
  },
  bindEvents() {
    $('.add_contact').on('click', this.handleAddForm.bind(this));
    $('main').on('click', '.cancel', this.handleClosingForm.bind(this));
    $('main').on('submit', '#create_contact', this.handleCreatingContact.bind(this));
    $('#contacts_container').on('click', '.edit', this.handleEditForm.bind(this));
    $('main').on('submit','#update_contact', this.handleUpdatingContact.bind(this));
    $('#contacts_container').on('click', '.delete', this.handleDeleting.bind(this));
    $('#contacts_container').on('click', '.tag', this.handleFiltering.bind(this));
    $('main').on('click', '#unfilter', this.handleUnfiltering.bind(this));
    $('#search_bar').on('input', this.handleSearching.bind(this));
  },
  retrieveStoredContacts() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/contacts');
    xhr.responseType = 'json';

    xhr.addEventListener('load', e => {
      if (xhr.status === 200) {
        this.contacts = xhr.response;
        this.contacts.forEach(contact => {
          contact.tags = contact.tags.split(',');
        });

        this.renderHomePage(this.contacts);
      }
    });

    xhr.send();
  },
  renderHomePage(contacts) {
    if (contacts.length > 0) {
      $('#contacts_container').html(this.contactsTemplate({ contacts: contacts }));
      $('#no_contacts').hide();
    } else {
      $('#contacts_container').html('');
      $('#no_contacts').show();
    }
  },
  init() {
    this.ANIMATION_DELAY = 300,
    this.retrieveStoredContacts();
    this.bindEvents();
    this.compileTemplates();
    this.createFormHTML = this.formTemplate({ purpose: 'create' });
  },
};

$(App.init.bind(App));
