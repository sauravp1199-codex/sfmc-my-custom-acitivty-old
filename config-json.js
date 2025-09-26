// ****************
// *
// * 
// config-json.js (AKA config.JSON)
// *
// APPLICATION EXTENSION THAT DEFINES YOUR CUSTOM ACTIVITY 
// *
// *
// ****************


module.exports = function configJSON(req) {
  return {
    workflowApiVersion: '1.1',
    // metaData points 
    metaData: {
      icon: 'images/icon.svg',
      iconSmall: 'images/icon.svg',
      category: 'message'
    },
    type: 'REST',
    lang: {
      'en-US': {
        name: 'SMS Send Activity',
        description: 'Collects SMS send parameters and delivers them to the execution endpoint'
      }
    },
    // Contains information sent to the activity each time it executes. 
    // See: https://developer.salesforce.com/docs/atlas.en-us.mc-apis.meta/mc-apis/how-data-binding-works.htm
    arguments: {
      // The API calls this method for each contact processed by the journey
      execute: {
        // Any static or data bound value configured for the activity. By default, the config.json file sets these arguments. Or you can add inArguments at configuration time
        inArguments: [],
        // Key and Value pair for each field expected in the response body of the request
        outArguments: [],
        // The amount of time we want JB to wait before canceling the request. Default is 60000, Minimum is 1000
        timeout: 90000,
        // how many retries if the request failed with 5xx error or network error
        retryCount: 5,
        // wait in ms between retry
        retryDelay: 1000,
        // the number of concurrent requests JB will send all together
        concurrentRequests: 5,
        // url:'https://customactivityv2.herokuapp.com/execute',
        // url:'http://localhost:3001/executeV2',
        url: 'https://sfmc.comsensetechnologies.com/executeV2',
      },
    },

    configurationArguments: {
      save: {
        url: 'https://sfmc.comsensetechnologies.com/save'
      },
      publish: {
        url: 'https://sfmc.comsensetechnologies.com/publish'
      },
      validate: {
        url: 'https://sfmc.comsensetechnologies.com/validate'
      },
      stop: {
        url: 'https://sfmc.comsensetechnologies.com/stop'
      }
    },

    // configurationArguments: {
    //   save: {
    //     url: 'https://customactivityv2.herokuapp.com/save'
    //   },
    //   publish: {
    //     url: 'https://customactivityv2.herokuapp.com/publish'
    //   },
    //   validate: {
    //     url: 'https://customactivityv2.herokuapp.com/validate'
    //   },
    //   stop: {
    //     url: 'https://customactivityv2.herokuapp.com/stop'
    //   }
    // },

    // userInterfaces: {
    //   configModal: {
    //     fullscreen: false
    //   }
    // },

    // schema Object mirrors the activity configuration from the top level of the config.json file and specifies schema information about in and out arguments. Schema objects follow this pattern: 
    // ** 
    // {
    //    dataType: MC Data Type,
    //    isNullable: boolean,
    //    direction: "in" or "out",
    //    access: "visible" or "hidden"
    // }
    schema: {
      arguments: {
        execute: {
          inArguments: [
            {
              campaignName: {
                dataType: 'Text',
                isNullable: 'False',
                direction: 'in',
                access: 'visible'
              },
              tiny: {
                dataType: 'Text',
                isNullable: 'False',
                direction: 'in',
                access: 'visible'
              },
              PE_ID: {
                dataType: 'Text',
                isNullable: 'False',
                direction: 'in',
                access: 'visible'
              },
              TEMPLATE_ID: {
                dataType: 'Text',
                isNullable: 'False',
                direction: 'in',
                access: 'visible'
              },
              TELEMARKETER_ID: {
                dataType: 'Text',
                isNullable: 'False',
                direction: 'in',
                access: 'visible'
              },
              message: {
                dataType: 'Text',
                isNullable: 'False',
                direction: 'in',
                access: 'visible'
              }
            }
          ],
          outArguments: []
        }
      }
    }
  }
}