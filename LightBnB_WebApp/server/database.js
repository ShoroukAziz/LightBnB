const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`
           SELECT * FROM  users
           WHERE LOWER(email) = $1`, [email.toLowerCase()])
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`
           SELECT * FROM  users
           WHERE id = $1`, [id])
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(`
           INSERT INTO  users ( name, email, password) VALUES ($1 ,$2, $3) RETURNING *;
           `, [user.name, user.email, user.password])
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryTex = `
  SELECT reservations.*, properties.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;
  
  `
  return pool
    .query(queryTex, [guest_id, limit])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getAllReservations = getAllReservations;


/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {

  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (Object.keys(options).length > 0) {
    console.log(options);

    queryString += `WHERE `;

    Object.keys(options).filter(e => options[e] !== '' && e !== 'minimum_rating')
      .forEach((optionKey, optionIndex) => {
        if (optionIndex > 0) {
          queryString += `AND `;
        }

        if (optionKey === 'city') {
          queryParams.push(`%${options.city}%`);
          queryString += `city LIKE $${queryParams.length} `;
        } else if (optionKey === 'minimum_price_per_night') {
          queryParams.push(`${options.minimum_price_per_night}`);
          queryString += `cost_per_night >= ($${queryParams.length} * 100 )`;
        } else if (optionKey === 'maximum_price_per_night') {
          queryParams.push(`${options.maximum_price_per_night}`);
          queryString += `cost_per_night <= ($${queryParams.length} * 100)`;
        } else if (optionKey === 'owner_id') {
          queryParams.push(`${options.owner_id}`);
          queryString += `owner_id = $${queryParams.length} `;
        }

      })

  }

  // 4
  queryString += `
  GROUP BY properties.id `

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {

  const queryString = `
  INSERT INTO properties (owner_id,  title, description,
      thumbnail_photo_url, cover_photo_url, cost_per_night,
      street, city, province,  post_code, country,
      parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,  $11,  $12,  $13,  $14) RETURNING *; `;

  const queryParams = [property.owner_id, property.title, property.description,
  property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night,
  property.street, property.city, property.province, property.post_code, property.country,
  property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });

}
exports.addProperty = addProperty;
