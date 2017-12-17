console.log('starting function')
const http = require('http')
const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'})

function alexaErrorMessage(message) {
    return {
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: `${message}`
        }
      }
    }
}

function alexaDelegate(intent, sessionAttributes) {
  return {
    version: "1.0",
    sessionAttributes,
    response: {
      directives: [
        {
          type: "Dialog.Delegate",
          updatedIntent: intent
        }
      ]
    }
  }
}

function clusterMatch(event, success, error) {
  // Cluster already in session
  if (event.session.attributes.target_cluster && event.request.intent.slots.cluster_name.value && (event.session.attributes.target_cluster.name === event.request.intent.slots.cluster_name.value)) {
    success(event.session.attributes.target_cluster)
  } else if (event.session.attributes.target_cluster && !event.request.intent.slots.cluster_name.value) {
    event.request.intent.slots.cluster_name.value = event.session.attributes.target_cluster.name
    success(event.session.attributes.target_cluster)
  } else {
    // Find cluster name in user available clusters
    let target_cluster = event.session.attributes.user_info.Item.clusters.find(function(cluster) {
      console.log('cluster: %j', cluster)
      return cluster.name === event.request.intent.slots.cluster_name.value
    })
    if (target_cluster) {
      headers = {}
      if (target_cluster.additional_headers) {
        headers = target_cluster.additional_headers
      }
      headers['Content-Type'] = 'application/json'
      success(
        {
          name: event.request.intent.slots.cluster_name.value,
          host: target_cluster.address.host,
          port: target_cluster.address.port,
          path: '/',
          method: 'POST',
          headers: headers
        }
      )
    } else if (event.request.intent.slots.cluster_name.value) {
      error(`Cluster ${event.request.intent.slots.cluster_name.value} not found in your permissions.`)
    } else {
      success(null)
    }
  }
}

function processRequest(event, target_cluster, cb) {
  if (target_cluster) {
    event.session.attributes.target_cluster = target_cluster
    var post_req = http.request(target_cluster, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('processing response: %j', chunk);
          cb(null, JSON.parse(chunk))
      })
    })
    post_req.write(JSON.stringify(event));
    post_req.end();
  } else {
    let response = alexaDelegate(event.request.intent, event.session.attributes)
    console.log('processing response: %j', response)
    cb(null, response)
  }
}

exports.handle = function(e, ctx, cb) {

  console.log('processing event: %j', e)

  if (!e.session.user.userId) {
    cb(null, alexaErrorMessage('Unable to identify your user ID.'))
    return
  } else if (e.request.type === 'SessionEndedRequest') {
    cb(null, alexaErrorMessage('Ending session due to lack of interactivity.'))
    return
  }

  // Replace for a harded code userId
  e.session.user.userId = 'amzn1.ask.account.AGZ6TBX2XXNJNTTJUMEVJGUAYHLAOBAOUJSCHAFSHDXKGD5YQPVWM6QOQ6GXHQJZUKLOTVB5LM5XHOMNTQFJBUN2WJY3Q5D2L4X76DM32PVIMPUTWUFCGL322Y2YHB2U4H2GG4D5ZRFPWXBUGKHAU47YZJUV3CAJJY4IXZH54T65Z3BNEVAGTZYB4VKACIDF5GNHSR5RE756SUY'

  // If user information ins't in session, get from ClusterPermission table
  if (!e.session.attributes || !e.session.attributes.user_info) {
    let params = {
      TableName: 'ClusterPermission',
      Key: {
        "user_id": e.session.user.userId
      }
    }
    docClient.get(params, function(err, data) {
      if (err) {
        cb(null, alexaErrorMessage('Error fetching data from permissions table.'))
      } else {
        if (Object.keys(data).length === 0) {
          cb(null, alexaErrorMessage('User not found in permissions table'))
        } else {
          console.log('data from dynamo db: %j', data)
          if (!e.session.attributes) {
            e.session.attributes = {
              user_info: data
            }
          } else {
            e.session.attributes.user_info = data
          }

          clusterMatch(
            e,
            function (cluster) {
              processRequest(e, cluster, cb)
            },
            function (message) {
              cb(null, alexaErrorMessage(message))
            }
          )
        }
      }
    })
  } else {
    clusterMatch(
      e,
      function (cluster) {
        processRequest(e, cluster, cb)
      },
      function (message) {
        cb(null, alexaErrorMessage(message))
      }
    )
  }

}
