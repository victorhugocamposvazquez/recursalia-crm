<?php
/**
 * Plugin Name: Recursalia Course API
 * Description: REST API para crear categorías y reseñas de Site Reviews desde el Course SaaS Generator.
 * Version: 1.1.0
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

  wp_set_object_terms($post_id, [(int) $term->term_id], 'site-review-category');

  return ['created' => $created];
}

function recursalia_create_course_curriculum(WP_REST_Request $request) {
  $course_id = (int) $request->get_param('course_id');
  $topics = $request->get_param('topics');
  $author_id = (int) ($request->get_param('author_id') ?? 1);

  if (!is_array($topics) || empty($topics)) {
    return new WP_Error('invalid', 'topics array required', ['status' => 400]);
  }

  $server = rest_get_server();
  $created_topics = 0;
  $created_lessons = 0;

  foreach ($topics as $topic) {
    $topic_title = isset($topic['title']) ? sanitize_text_field($topic['title']) : '';
    $topic_lessons = isset($topic['lessons']) && is_array($topic['lessons']) ? $topic['lessons'] : [];

    if (empty($topic_title)) continue;

    $topic_summary = '';
    if (!empty($topic_lessons[0]['title'])) {
      $topic_summary = sanitize_text_field($topic_lessons[0]['title']);
    }

    $topic_req = new WP_REST_Request('POST', '/tutor/v1/topics');
    $topic_req->set_header('Content-Type', 'application/json');
    $topic_req->set_body_params([
      'topic_course_id' => $course_id,
      'topic_title' => $topic_title,
      'topic_summary' => $topic_summary,
      'topic_author' => $author_id,
    ]);

    $topic_res = $server->dispatch($topic_req);
    $topic_status = $topic_res->get_status();

    if ($topic_status < 200 || $topic_status >= 300) {
      $topic_data = $topic_res->get_data();
      $msg = is_array($topic_data) && isset($topic_data['message']) ? $topic_data['message'] : $topic_res->get_data();
      return new WP_Error('tutor_topic_failed', 'Tutor Topic: ' . json_encode($msg), ['status' => $topic_status]);
    }

    $topic_data = $topic_res->get_data();
    $topic_id = is_array($topic_data) && isset($topic_data['ID']) ? (int) $topic_data['ID'] : (isset($topic_data['id']) ? (int) $topic_data['id'] : 0);

    if (!$topic_id) {
      return new WP_Error('tutor_topic_no_id', 'Tutor did not return topic ID', ['status' => 500]);
    }

    $created_topics++;

    foreach ($topic_lessons as $lesson) {
      $lesson_title = isset($lesson['title']) ? sanitize_text_field($lesson['title']) : '';
      $lesson_content = isset($lesson['content']) ? wp_kses_post($lesson['content']) : '';

      if (empty($lesson_title)) continue;

      $lesson_req = new WP_REST_Request('POST', '/tutor/v1/lessons');
      $lesson_req->set_header('Content-Type', 'application/json');
      $lesson_req->set_body_params([
        'topic_id' => $topic_id,
        'course_id' => $course_id,
        'lesson_title' => $lesson_title,
        'lesson_content' => $lesson_content,
        'lesson_author' => $author_id,
      ]);

      $lesson_res = $server->dispatch($lesson_req);
      $lesson_status = $lesson_res->get_status();

      if ($lesson_status < 200 || $lesson_status >= 300) {
        $lesson_data = $lesson_res->get_data();
        $msg = is_array($lesson_data) && isset($lesson_data['message']) ? $lesson_data['message'] : $lesson_res->get_data();
        return new WP_Error('tutor_lesson_failed', 'Tutor Lesson: ' . json_encode($msg), ['status' => $lesson_status]);
      }

      $created_lessons++;
    }
  }

  return [
    'created_topics' => $created_topics,
    'created_lessons' => $created_lessons,
  ];
}
