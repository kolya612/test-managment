const { ValidationError } = require('./ValidationError');
const express = require('express');
const app = express();
const form = require('express-form');
const connectionString = process.env.DATABASE_URL;
const { Pool } = require('pg');
const field = form.field;
const sql = new Pool({ connectionString,});

const topic = process.env.KAFKA_TOPIC;
const { KFProducer } = require('./kfproducer');
const kafka = new KFProducer();
// kafka.send(topic, 'Holala');



/**
 * CONSUMER
 */
/*
const Kafka2 = require('node-rdkafka');

const consumer = new Kafka2.KafkaConsumer({
	'group.id': 'kafka',
	'metadata.broker.list': process.env.KAFKA_BROKERS,
}, {});
consumer.on('event.log', function(log) {
	console.log(log);
});
consumer.on('event.error', function(err) {
	console.error('Error from consumer');
	console.error(err);
});
var counter = 0;
var numMessages = 5;

consumer.on('ready', function(arg) {
	console.log('consumer ready.' + JSON.stringify(arg));

	consumer.subscribe([topic]);
	//start consuming messages
	consumer.consume();
});

consumer.on('data', function(m) {
	counter++;

	//committing offsets every numMessages
	if (counter % numMessages === 0) {
		console.log('calling commit');
		consumer.commit(m);
	}

	// Output the actual message contents
	//console.log(JSON.stringify(m));
	console.log(m.value.toString());

});
consumer.on('disconnected', function(arg) {
	console.log('consumer disconnected. ' + JSON.stringify(arg));
});

//starting the consumer
consumer.connect();
*/
//stopping this example after 30s
//setTimeout(function() {
//    consumer.disconnect();
//}, 20000);







/**
 * ADD USER 
 */
app.post("/users",
	form(
		field("name").trim().required().is(/^[a-zA-Zа-яА-ЯёЁ]+$/).minLength(2).maxLength(50),
		field("email").trim().required().isEmail(),
		field("sex").trim().required().is(/^[1-2]{1}$/)
	),
	(req, rs, next) => {
		if (!req.form.isValid) {
			throw new ValidationError(req.form.getErrors());
		}
		next();
	}, 
	async (req, rs, next) => {
		try{
			const querySql = 'INSERT INTO users (name, email, sex) VALUES ($1,$2,$3) RETURNING *';
			const valueForSql = [req.form.name, req.form.email, req.form.sex];
			const { rows:user } = await sql.query(querySql, valueForSql);
			kafka.send(topic, 'test-topic-2-create-user', user[0], 'user', user[0].id);
			rs.status(200).send(user[0]);
		} catch (err){
			rs.status(500).send({ 'errorMessage': 'Something went wrong' });
		}		
	}
);

/** 
 * UPDATE USER 
 */
app.put("/users/:id", 
	form(
		field("id").trim().required().is(/^[0-9]+$/), 
		field("name").trim().required().is(/^[a-zA-Zа-яА-ЯёЁ]+$/).minLength(2).maxLength(50),
		field("email").trim().required().isEmail(),
		field("sex").trim().required().is(/^[1-2]{1}$/)
	),
	(req, rs, next) => {
		if (!req.form.isValid) {
			throw new ValidationError(req.form.getErrors());
		}
		next();
	}, 
	async (req, rs, next) => {
		try{
			const querySql = 'UPDATE users SET name = $1, email = $2, sex = $3 WHERE id = $4 RETURNING *';
			const valueForSql = [req.form.name, req.form.email, req.form.sex, req.form.id];
			const { rows:user } = await sql.query(querySql, valueForSql);
			rs.status(200).send(user[0]);
		} catch (err){
			rs.status(500).send({ 'errorMessage': 'Something went wrong' });
		}
	}
);

/** 
 * DELETE USER 
 */
app.delete("/users/:id",
	form(field("id").trim().required().is(/^[0-9]+$/)), 
    (req, rs, next) => {
		if (!req.form.isValid) {
			throw new ValidationError(req.form.getErrors());
		}
		next();
	}, 
	async (req, rs, next) => {
		try{
			const querySql = 'DELETE FROM users WHERE id = $1';
			const valueForSql = [req.form.id];
			await sql.query(querySql, valueForSql);
			rs.status(200).send({ 'message': 'User successfully deleted' });
		} catch (err){
			rs.status(500).send({ 'errorMessage': 'Something went wrong' });
		}
	}
);

let queueNum = 0;
/** 
 * GET USERS  
 */
app.get("/users", 
	async (req, rs) => {
		try{
			const querySql = 'SELECT * FROM users';
			const { rowCount, rows:users } = await sql.query(querySql);
		  	if(rowCount == 0){
				rs.status(404).send({ 'errorMessage': 'Users not found' }); 
		  	}
			kafka.send(topic, 'test-topic-2-get-user', users, 'user', rowCount);
		  	rs.status(200).send(users);
	    } catch (err){
	    	//rs.status(500).send(err.stack);
			rs.status(500).send({ 'errorMessage': 'Something went wrong' });
		}
	},

);

/** 
 * GET USER BY ID 
 */
app.get("/users/:id", 
	form(field("id").trim().required().is(/^[0-9]+$/)), 
	(req, rs, next) => {	
		if (!req.form.isValid) {
			throw new ValidationError(req.form.getErrors());
		}
		next();
	}, 
	async (req, rs, next) => {
		try{
			const querySql = 'SELECT * FROM users WHERE id = $1';
			const valueForSql = [req.form.id];
			const { rowCount, rows:user } = await sql.query(querySql, valueForSql);
		  	if(rowCount == 0){
				rs.status(404).send({ 'errorMessage': 'Users not found' }); 
		  	} 
		  	rs.status(200).send(user);
		} catch (err){
			rs.status(500).send({ 'errorMessage': 'Something went wrong' });
		}
	},
);

/** 
 * 404
 */
app.all("*", (req, rs) => {
    rs.status(404).send({ 'MessageError': '404' });
});

/** 
 * Form validation error
 */
app.use((err, req, rs, next) => {
	rs.status(406).send(err);
});

module.exports = app;