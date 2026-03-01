<?php
/**
 * Plugin Name: Recursalia Course API
 * Description: REST API para crear categorías y reseñas de Site Reviews desde el Course SaaS Generator.
 * Version: 1.0.0
 * Author: Recursalia
 */

if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
  register_rest_route('recursalia/v1', '/review-category', [
    'methods' => 'POST',
    'callback' => 'recursalia_create_review_category',
    'permission_callback' => 'recursalia_check_auth',
    'args' => [
      'name' => ['required' => true, 'type' => 'string'],
      'slug' => ['required' => false, 'type' => 'string'],
    ],
  ]);

  register_rest_route('recursalia/v1', '/reviews', [
    'methods' => 'POST',
    'callback' => 'recursalia_create_reviews',
    'permission_callback' => 'recursalia_check_auth',
    'args' => [
      'assigned_post_id' => ['required' => true, 'type' => 'integer'],
      'category_slug' => ['required' => true, 'type' => 'string'],
      'reviews' => ['required' => true, 'type' => 'array'],
    ],
  ]);
});

function recursalia_check_auth(WP_REST_Request $request) {
  return current_user_can('edit_posts');
}

function recursalia_create_review_category(WP_REST_Request $request) {
  $name = sanitize_text_field($request->get_param('name'));
  $slug = $request->get_param('slug');

  if (empty($name)) {
    return new WP_Error('invalid', 'Name required', ['status' => 400]);
  }

  $slug = $slug ? sanitize_title($slug) : sanitize_title($name);

  $term = wp_insert_term($name, 'site-review-category', [
    'slug' => $slug,
  ]);

  if (is_wp_error($term)) {
    if ($term->get_error_code() === 'term_exists') {
      $term_id = $term->get_error_data();
      $term_obj = get_term($term_id, 'site-review-category');
      return [
        'term_id' => (int) $term_id,
        'slug' => $term_obj ? $term_obj->slug : $slug,
      ];
    }
    return new WP_Error('insert_failed', $term->get_error_message(), ['status' => 500]);
  }

  return [
    'term_id' => (int) $term['term_id'],
    'slug' => $slug,
  ];
}

function recursalia_create_reviews(WP_REST_Request $request) {
  $post_id = (int) $request->get_param('assigned_post_id');
  $category_slug = sanitize_text_field($request->get_param('category_slug'));
  $reviews = $request->get_param('reviews');

  if (!function_exists('glsr_create_review')) {
    return new WP_Error('plugin_missing', 'Site Reviews plugin not active', ['status' => 500]);
  }

  $term = get_term_by('slug', $category_slug, 'site-review-category');
  if (!$term) {
    return new WP_Error('category_not_found', 'Review category not found', ['status' => 404]);
  }

  $created = 0;
  foreach ($reviews as $r) {
    $title = isset($r['title']) ? sanitize_text_field($r['title']) : '';
    $content = isset($r['content']) ? sanitize_textarea_field($r['content']) : '';
    $rating = isset($r['rating']) ? max(1, min(5, (int) $r['rating'])) : 5;
    $author = isset($r['author_name']) ? sanitize_text_field($r['author_name']) : 'Anónimo';
    $date = isset($r['date']) ? sanitize_text_field($r['date']) : current_time('Y-m-d');

    if (empty($title)) continue;

    $result = glsr_create_review([
      'title' => $title,
      'content' => $content,
      'rating' => $rating,
      'name' => $author,
      'date' => $date,
      'assigned_posts' => [$post_id],
      'assigned_terms' => ['site-review-category' => [$term->term_id]],
    ]);

    if ($result && !is_wp_error($result)) {
      $created++;
    }
  }

  return ['created' => $created];
}
