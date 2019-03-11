/**
 * PRODUCER
 */
const Kafka = require('node-rdkafka');
const uuidv4 = require('uuid/v4');

class KFProducer {
    constructor() {
        this.connected = false;
        // this.queue = [];
        this.producer = this.createProducer();
    }

    createProducer() {
        const producer = new Kafka.Producer({
            'client.id': 'kafka',
            'offset.store.method': 'broker',
            'metadata.broker.list': process.env.KAFKA_BROKERS,
            'dr_cb': true
        });

         producer.on('ready', () => {
        //     this.connected = true;
        //
             console.info('Producer is ready');
        //
        //     if (this.queue.length) {
        //         for (let late of this.queue) {
        //             console.info('send from queue', {late});
        //             this._send(late.topic, late.msg);
        //         }
        //         this.queue = [];
        //         console.info('emptying queue', {queue: this.queue});
        //     }
         });

        producer.on('event.error', function (err) {
            console.error('Error from producer');
            console.error(err);
        });

        this.connect();

        return producer;
    }

    connect() {
        // console.info('!!!!!!!!!!start timeout!!!!!!!!!!!!');
        setTimeout(() => {
        //     console.info('timeout run!!!');
            this.producer.connect();
            this.producerPoller = setInterval(
                () => {
                    //console.log('polling');
                    this.producer.poll();
                },
                10
            );
        }, 10);
    }

    disconnect() {
        if (this.producerPoller) {
            // console.info('producer disconnected');
            clearInterval(this.producerPoller);
        }

        this.producer.disconnect();
    }

    // _send (topic, message) {
    //     console.info('___send', {topic, message});
    //
    //     if (typeof message !== 'string') {
    //         message = JSON.stringify(message);
    //     }
    //
    //     this.producer.produce(topic, -1, Buffer.from(message));
    //     this.producer.poll();
    // }

    send (topic, type, message, tags, shardKey = null) {
        // console.info('send');
        //
        // if (!this.connected) {
        //     this.queue.push({topic: topic, msg: message});
        //     console.info('store into queue', {queue: this.queue});
        //     return;
        // }
        //
        // console.info('connected!!! sending...');
        //
        // console.info('send without queue');
        // message.yes = 1;
        // this._send(topic, message);
        this.producer.produce(
             topic || type,
            -1,
            Buffer.from(
                JSON.stringify({
                    id: uuidv4(),
                    type,
                    message,
                    tags,
                })
            ),
            shardKey,
            Date.now(),
        );
        this.producer.poll();
    }
}

module.exports = {
    KFProducer,
};