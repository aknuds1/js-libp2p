'use strict'
/* eslint-disable no-console */

/*
 * Dialer Node
 */

const PeerId = require('@arve.knudsen/peer-id')
const PeerInfo = require('@arve.knudsen/peer-info')
const Node = require('./libp2p-bundle')
const pull = require('pull-stream')
const async = require('async')

async.parallel([
  (cb) => PeerId.createFromJSON(require('./id-d'), cb),
  (cb) => PeerId.createFromJSON(require('./id-l'), cb)
], (err, ids) => {
  if (err) { throw err }

  // Dialer
  const dialerId = ids[0]
  const dialerPeerInfo = new PeerInfo(dialerId)
  dialerPeerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
  const dialerNode = new Node({
    peerInfo: dialerPeerInfo
  })

  // Peer to Dial
  const listenerPeerInfo = new PeerInfo(ids[1])
  const listenerId = ids[1]
  const listenerMultiaddr = '/ip4/127.0.0.1/tcp/10333/p2p/' +
      listenerId.toB58String()
  listenerPeerInfo.multiaddrs.add(listenerMultiaddr)

  dialerNode.start((err) => {
    if (err) { throw err }

    console.log('Dialer ready, listening on:')
    dialerPeerInfo.multiaddrs.forEach((ma) => console.log(ma.toString() +
          '/p2p/' + dialerId.toB58String()))

    console.log('Dialing to peer:', listenerMultiaddr.toString())
    dialerNode.dialProtocol(listenerPeerInfo, '/echo/1.0.0', (err, conn) => {
      if (err) { throw err }

      console.log('nodeA dialed to nodeB on protocol: /echo/1.0.0')

      pull(
        pull.values(['hey']),
        conn,
        pull.collect((err, data) => {
          if (err) { throw err }
          console.log('received echo:', data.toString())
        })
      )
    })
  })
})
