// ****************
// *
// * 
// [activityName].js
// *
// CONTAINS POSTMONGER EVENTS AND SITS IN BETWEEN YOUR CONFIGURATION APP IN THE iFRAME AND JOURNEY BUILDER
// *
// *
// ****************

// Custom activities load inside an iframe. We'll use postmonger to manage
// the cross-document messaging between journey builder and the activity
const Postmonger = require('postmonger')


// Creates a new connection for this session.
// We use this connection to talk to Journey Builder. You'll want to keep this
// reference handy and pass it into your UI framework if you're using React, Vue, etc.
const connection = new Postmonger.Session();
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
// We'll store the activity on this variable when we receive it
let activity = {};

const FIELD_DEFINITIONS = [
  { id: 'campaignName', label: 'Campaign Name', required: true },
  { id: 'tiny', label: 'Tiny', required: true },
  { id: 'PE_ID', label: 'PE ID', required: true },
  { id: 'TEMPLATE_ID', label: 'Template ID', required: true },
  { id: 'TELEMARKETER_ID', label: 'Telemarketer ID', required: true },
  { id: 'message', label: 'Message', required: true }
];

// Wait for the document to load before we do anything
document.addEventListener('DOMContentLoaded', function main() {
  FIELD_DEFINITIONS.forEach(({ id }) => {
    const field = document.getElementById(id);

    if (!field) {
      console.warn(`Field with id "${id}" is missing from the DOM.`);
      return;
    }

    const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(eventName, () => {
      clearFieldError(id);
      onFormEntry({ target: field });
    });
  });

  if (isDev) {
    console.log('DEV MODE ENABLED - TRIGGERING MOCK JB -> CUSTOM ACTIVITY SIGNAL');
    setupExampleTestHarness();
  }

  // Bind the initActivity event...
  // Journey Builder will respond with 'initActivity' after it receives the "ready" signal
  connection.on('initActivity', onInitActivity);
  connection.on('clickedNext', onDoneButtonClick);

  // We're all set! let's signal Journey Builder
  // that we're ready to receive the activity payload...
  // Tell the parent iFrame that we are ready.
  connection.trigger('ready');
  console.log('Journey Builder has been signaled we may receive payload...');
});

// this function is triggered by Journey Builder via Postmonger.
// Journey Builder will send us a copy of the activity here
function onInitActivity(payload) {
  // Set the activity object from this payload. We'll refer to this object as we
  // modify it before saving.
  activity = payload || {};
  console.log(activity);

  const inArguments = activity.arguments &&
    activity.arguments.execute &&
    Array.isArray(activity.arguments.execute.inArguments) &&
    activity.arguments.execute.inArguments.length > 0
      ? activity.arguments.execute.inArguments
      : [];

  const mergedArguments = Object.assign({}, ...inArguments);

  FIELD_DEFINITIONS.forEach(({ id }) => {
    if (Object.prototype.hasOwnProperty.call(mergedArguments, id)) {
      setFieldValue(id, mergedArguments[id]);
      clearFieldError(id);
    }
  });

  if (activity.metaData && activity.metaData.isConfigured) {
    return;
  }

  const hasAllValues = FIELD_DEFINITIONS.every(({ id }) => {
    const value = mergedArguments[id];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });

  if (hasAllValues) {
    activity.metaData = activity.metaData || {};
    activity.metaData.isConfigured = true;
  }
}

function setFieldValue(id, value) {
  const field = document.getElementById(id);

  if (!field) {
    return;
  }

  if (field.tagName === 'SELECT') {
    field.value = value !== undefined && value !== null ? String(value) : field.value;
  } else {
    field.value = value !== undefined && value !== null ? String(value) : '';
  }
}

function getFieldContainer(id) {
  return document.querySelector(`[data-field="${id}"]`);
}

function showFieldError(id, message) {
  const container = getFieldContainer(id);

  if (!container) {
    return;
  }

  container.classList.add('slds-has-error');

  const helper = container.querySelector('.error-text');

  if (helper) {
    helper.textContent = message;
  }
}

function clearFieldError(id) {
  const container = getFieldContainer(id);

  if (!container) {
    return;
  }

  container.classList.remove('slds-has-error');

  const helper = container.querySelector('.error-text');

  if (helper) {
    helper.textContent = '';
  }
}

function getFieldValue(field) {
  if (!field) {
    return '';
  }

  if (field.tagName === 'SELECT') {
    return field.value;
  }

  return typeof field.value === 'string' ? field.value.trim() : field.value;
}

function onDoneButtonClick() {
  const fieldPayload = {};
  let hasErrors = false;

  FIELD_DEFINITIONS.forEach(({ id, label, required }) => {
    const field = document.getElementById(id);

    if (!field) {
      return;
    }

    const value = getFieldValue(field);

    if (required && (value === undefined || value === null || value === '')) {
      showFieldError(id, `${label} is required.`);
      hasErrors = true;
      return;
    }

    fieldPayload[id] = field.tagName === 'SELECT' ? value : value;
  });

  if (hasErrors) {
    return;
  }

  // we must set metaData.isConfigured in order to tell JB that this activity
  // is ready for activation
  activity.metaData = activity.metaData || {};
  activity.metaData.isConfigured = true;

  activity.arguments = activity.arguments || {};
  activity.arguments.execute = activity.arguments.execute || {};
  activity.arguments.execute.inArguments = [fieldPayload];

  connection.trigger('updateActivity', activity);
  console.log(`Activity has been updated. Activity: ${JSON.stringify(activity)}`);
}

function onCancelButtonClick() {
  // tell Journey Builder that this activity has no changes.
  // we won't be prompted to save changes when the inspector closes
  connection.trigger('setActivityDirtyState', false);

  // now request that Journey Builder closes the inspector/drawer
  connection.trigger('requestInspectorClose');
}

// HANDLER TO DISABLE "DONE" BUTTON - SAMPLE BELOW
function onFormEntry(e) {
  if (!e || !e.target) {
    return;
  }

  const value = getFieldValue(e.target);

  if (value && value.length > 0) {
    // let journey builder know the activity has changes
    connection.trigger('setActivityDirtyState', true);
  }
}


// this function is for example purposes only. it sets ups a Postmonger
// session that emulates how Journey Builder works. You can call jb.ready()
// from the console to kick off the initActivity event with a mock activity object
function setupExampleTestHarness() {

  const jbSession = new Postmonger.Session();
  const jb = {};
  window.jb = jb;

  jbSession.on('setActivityDirtyState', function(value) {
      console.log('[echo] setActivityDirtyState -> ', value);
  });

  jbSession.on('requestInspectorClose', function() {
      console.log('[echo] requestInspectorClose');
  });

  jbSession.on('updateActivity', function(activity) {
      console.log('[echo] updateActivity -> ', JSON.stringify(activity, null, 4));
  });

  jbSession.on('ready', function() {
      console.log('[echo] ready');
      console.log('\tuse jb.ready() from the console to initialize your activity')
  });

  jb.save = () => {
    onDoneButtonClick()
  }

  // fire the ready signal with an example activity
  jb.ready = () => {
      jbSession.trigger('initActivity', {
        name: '',
        key: 'EXAMPLE-1',
        metaData: {},
        configurationArguments: {},
        arguments: {
            executionMode: "{{Context.ExecutionMode}}",
            definitionId: "{{Context.DefinitionId}}",
            activityId: "{{Activity.Id}}",
            contactKey: "{{Context.ContactKey}}",
            execute: {
                inArguments: [
                  {
                    campaignName: 'Sample Campaign',
                    tiny: '1',
                    PE_ID: '12345',
                    TEMPLATE_ID: '67890',
                    TELEMARKETER_ID: 'TM-001',
                    message: 'Sample SMS body'
                  }
                ],
                outArguments: []
            },
            startActivityKey: "{{Context.StartActivityKey}}",
            definitionInstanceId: "{{Context.DefinitionInstanceId}}",
            requestObjectId: "{{Context.RequestObjectId}}"
        }
      });
  };
}