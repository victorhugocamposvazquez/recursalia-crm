<?php
/**
 * Plugin Name: Recursalia Course API
 * Description: REST API para crear categorías y reseñas de Site Reviews desde el Course SaaS Generator.
 * Version: 1.3.0
 * Author: Recursalia
 */

if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
  register_rest_route('recursalia/v1', '/course-category', [
    'methods' => 'POST',
    'callback' => 'recursalia_create_course_category',
    'permission_callback' => 'recursalia_check_auth',
    'args' => [
      'name' => ['required' => true, 'type' => 'string'],
      'slug' => ['required' => false, 'type' => 'string'],
    ],
  ]);

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
      'category_slug' => ['required' => false, 'type' => 'string'],
      'category_term_id' => ['required' => false, 'type' => 'integer'],
      'reviews' => ['required' => true, 'type' => 'array'],
    ],
  ]);

  register_rest_route('recursalia/v1', '/course-assign-category', [
    'methods' => 'POST',
    'callback' => 'recursalia_assign_course_category',
    'permission_callback' => 'recursalia_check_auth',
    'args' => [
      'course_id' => ['required' => true, 'type' => 'integer'],
      'term_id' => ['required' => true, 'type' => 'integer'],
    ],
  ]);

  register_rest_route('recursalia/v1', '/course-set-product', [
    'methods' => 'POST',
    'callback' => 'recursalia_set_course_product',
    'permission_callback' => 'recursalia_check_auth',
    'args' => [
      'course_id' => ['required' => true, 'type' => 'integer'],
      'product_id' => ['required' => true, 'type' => 'integer'],
    ],
  ]);

  register_rest_route('recursalia/v1', '/course-curriculum', [
    'methods' => 'POST',
    'callback' => 'recursalia_create_course_curriculum',
    'permission_callback' => 'recursalia_check_auth',
    'args' => [
      'course_id' => ['required' => true, 'type' => 'integer'],
      'topics' => ['required' => true, 'type' => 'array'],
      'author_id' => ['required' => false, 'type' => 'integer', 'default' => 1],
    ],
  ]);
});

function recursalia_check_auth(WP_REST_Request $request) {
  return current_user_can('edit_posts');
}

function recursalia_create_course_category(WP_REST_Request $request) {
  $name = sanitize_text_field($request->get_param('name'));
  $slug = $request->get_param('slug');

  if (empty($name)) {
    return new WP_Error('invalid', 'Name required', ['status' => 400]);
  }

  $taxonomy = 'course-category';
  if (!taxonomy_exists($taxonomy)) {
    return new WP_Error('taxonomy_missing', 'Tutor LMS course-category taxonomy not found. Is Tutor LMS active?', ['status' => 500]);
  }

  $slug = $slug ? sanitize_title($slug) : sanitize_title($name);
  $term = wp_insert_term($name, $taxonomy, ['slug' => $slug]);

  if (is_wp_error($term)) {
    if ($term->get_error_code() === 'term_exists') {
      $term_id = $term->get_error_data();
      $term_obj = get_term($term_id, $taxonomy);
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

function recursalia_assign_course_category(WP_REST_Request $request) {
  $course_id = (int) $request->get_param('course_id');
  $term_id = (int) $request->get_param('term_id');

  $taxonomy = 'course-category';
  if (!taxonomy_exists($taxonomy)) {
    return new WP_Error('taxonomy_missing', 'course-category taxonomy not found', ['status' => 500]);
  }

  $term = get_term($term_id, $taxonomy);
  if (!$term || is_wp_error($term)) {
    return new WP_Error('term_not_found', 'Category term not found', ['status' => 404]);
  }

  $post = get_post($course_id);
  if (!$post || $post->post_type !== 'courses') {
    return new WP_Error('course_not_found', 'Course not found', ['status' => 404]);
  }

  $result = wp_set_object_terms($course_id, [$term_id], $taxonomy);
  if (is_wp_error($result)) {
    return new WP_Error('assign_failed', $result->get_error_message(), ['status' => 500]);
  }

  update_post_meta($course_id, 'assigned_term_id', (string) $term_id);
  return ['assigned' => true];
}

function recursalia_set_course_product(WP_REST_Request $request) {
  $course_id = (int) $request->get_param('course_id');
  $product_id = (int) $request->get_param('product_id');

  $post = get_post($course_id);
  if (!$post || $post->post_type !== 'courses') {
    return new WP_Error('course_not_found', 'Course not found', ['status' => 404]);
  }

  update_post_meta($course_id, '_tutor_course_product_id', (string) $product_id);

  return ['ok' => true];
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
  $category_slug = sanitize_text_field($request->get_param('category_slug') ?? '');
  $category_term_id = (int) $request->get_param('category_term_id');
  $reviews = $request->get_param('reviews');

  if (!function_exists('glsr_create_review')) {
    return new WP_Error('plugin_missing', 'Site Reviews plugin not active', ['status' => 500]);
  }

  $term = null;
  if ($category_term_id > 0) {
    $term = get_term($category_term_id, 'site-review-category');
  }
  if (!$term && !empty($category_slug)) {
    $term = get_term_by('slug', $category_slug, 'site-review-category');
  }
  if (!$term || is_wp_error($term)) {
    return new WP_Error('category_not_found', 'Review category not found. Provide category_term_id or category_slug.', ['status' => 404]);
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
      'is_approved' => true,
      'assigned_posts' => [$post_id],
      'assigned_terms' => ['site-review-category' => [$term->term_id]],
    ]);

    if ($result && !is_wp_error($result)) {
      $review_id = is_object($result) ? ($result->ID ?? $result->id ?? 0) : (int) $result;
      if ($review_id > 0) {
        wp_set_object_terms($review_id, [(int) $term->term_id], 'site-review-category');
        $created++;
      }
    }
  }

  // Asociar el curso a la categoría de Site Reviews si la taxonomía lo soporta
  $tax_obj = get_taxonomy('site-review-category');
  if ($tax_obj && isset($tax_obj->object_type) && in_array(get_post_type($post_id), (array) $tax_obj->object_type, true)) {
    wp_set_object_terms($post_id, [(int) $term->term_id], 'site-review-category');
  }

  // Guardar el term_id de Site Reviews en el curso para que el campo "Assigned Term ID" lo muestre
  update_post_meta($post_id, 'assigned_term_id', (string) $term->term_id);
  update_post_meta($post_id, 'site_review_term_id', (string) $term->term_id);

  return ['created' => $created];
}

function recursalia_create_course_curriculum(WP_REST_Request $request) {
  $course_id = (int) $request->get_param('course_id');
  $topics = $request->get_param('topics');
  $author_id = (int) ($request->get_param('author_id') ?? 1);

  if (!is_array($topics) || empty($topics)) {
    return new WP_Error('invalid', 'topics array required', ['status' => 400]);
  }

  // Tutor Pro usa tutor_topics y tutor_lesson
  $topic_post_type = post_type_exists('tutor_topics') ? 'tutor_topics' : (post_type_exists('topics') ? 'topics' : 'tutor_topics');
  $lesson_post_type = post_type_exists('tutor_lesson') ? 'tutor_lesson' : (post_type_exists('lesson') ? 'lesson' : 'tutor_lesson');

  $created_topics = 0;
  $created_lessons = 0;
  $topic_ids = [];

  foreach ($topics as $topic) {
    $topic_title = isset($topic['title']) ? sanitize_text_field($topic['title']) : '';
    $topic_lessons = isset($topic['lessons']) && is_array($topic['lessons']) ? $topic['lessons'] : [];

    if (empty($topic_title)) continue;

    $topic_summary = '';
    if (!empty($topic_lessons[0]['title'])) {
      $topic_summary = sanitize_text_field($topic_lessons[0]['title']);
    }

    $topic_order = $created_topics + 1;
    $topic_id = wp_insert_post([
      'post_type' => $topic_post_type,
      'post_title' => $topic_title,
      'post_content' => $topic_summary,
      'post_status' => 'publish',
      'post_author' => $author_id,
      'menu_order' => $topic_order,
    ]);

    if (is_wp_error($topic_id) || !$topic_id) {
      return new WP_Error('tutor_topic_failed', 'Failed to create topic: ' . (is_wp_error($topic_id) ? $topic_id->get_error_message() : 'unknown'), ['status' => 500]);
    }

    update_post_meta($topic_id, '_tutor_course_id', $course_id);
    update_post_meta($topic_id, 'topic_course_id', $course_id);

    $created_topics++;
    $topic_ids[] = $topic_id;

    foreach ($topic_lessons as $idx => $lesson) {
      $lesson_title = isset($lesson['title']) ? sanitize_text_field($lesson['title']) : '';
      $lesson_content = isset($lesson['content']) ? wp_kses_post($lesson['content']) : '';

      if (empty($lesson_title)) continue;

      $lesson_id = wp_insert_post([
        'post_type' => $lesson_post_type,
        'post_title' => $lesson_title,
        'post_content' => $lesson_content,
        'post_status' => 'publish',
        'post_author' => $author_id,
        'menu_order' => $idx + 1,
      ]);

      if (is_wp_error($lesson_id) || !$lesson_id) {
        continue;
      }

      update_post_meta($lesson_id, '_tutor_course_id', $course_id);
      update_post_meta($lesson_id, '_tutor_topic_id', $topic_id);
      update_post_meta($lesson_id, 'topic_id', $topic_id);
      update_post_meta($lesson_id, 'course_id', $course_id);

      $created_lessons++;
    }
  }

  if (!empty($topic_ids)) {
    $existing = get_post_meta($course_id, '_tutor_course_topics_ids', true);
    $ids = is_array($existing) ? $existing : [];
    $ids = array_values(array_unique(array_merge($ids, $topic_ids)));
    update_post_meta($course_id, '_tutor_course_topics_ids', $ids);
  }

  return [
    'created_topics' => $created_topics,
    'created_lessons' => $created_lessons,
  ];
}
