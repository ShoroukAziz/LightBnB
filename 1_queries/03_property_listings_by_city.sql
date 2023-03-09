SELECT properties.id,
  properties.title,
  properties.cost_per_night,
  avg(rating) as average_rating
FROM properties
  LEFT JOIN property_reviews on properties.id = property_reviews.property_id
WHERE city LIKE '%ancouver%'
GROUP BY properties.id
HAVING avg(rating) >= 4
ORDER BY cost_per_night 
LIMIT 10;