Exception in thread django-main-thread:
Traceback (most recent call last):
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/rest_framework/settings.py", line 179, in import_from_string
    return import_string(val)
           ^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/utils/module_loading.py", line 30, in import_string
    return cached_import(module_path, class_name)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/utils/module_loading.py", line 15, in cached_import
    module = import_module(module_path)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/homebrew/Cellar/python@3.12/3.12.2_1/Frameworks/Python.framework/Versions/3.12/lib/python3.12/importlib/__init__.py", line 90, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 995, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/dj_rest_auth/jwt_auth.py", line 6, in <module>
    from rest_framework_simplejwt.authentication import JWTAuthentication
ModuleNotFoundError: No module named 'rest_framework_simplejwt'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/opt/homebrew/Cellar/python@3.12/3.12.2_1/Frameworks/Python.framework/Versions/3.12/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/opt/homebrew/Cellar/python@3.12/3.12.2_1/Frameworks/Python.framework/Versions/3.12/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/utils/autoreload.py", line 64, in wrapper
    fn(*args, **kwargs)
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/core/management/commands/runserver.py", line 133, in inner_run
    self.check(display_num_errors=True)
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/core/management/base.py", line 486, in check
    all_issues = checks.run_checks(
                 ^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/core/checks/registry.py", line 88, in run_checks
    new_errors = check(app_configs=app_configs, databases=databases)
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/core/checks/urls.py", line 14, in check_url_config
    return check_resolver(resolver)
           ^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/core/checks/urls.py", line 24, in check_resolver
    return check_method()
           ^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/urls/resolvers.py", line 519, in check
    for pattern in self.url_patterns:
                   ^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/utils/functional.py", line 47, in __get__
    res = instance.__dict__[self.name] = self.func(instance)
                                         ^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/urls/resolvers.py", line 738, in url_patterns
    patterns = getattr(self.urlconf_module, "urlpatterns", self.urlconf_module)
                       ^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/utils/functional.py", line 47, in __get__
    res = instance.__dict__[self.name] = self.func(instance)
                                         ^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/urls/resolvers.py", line 731, in urlconf_module
    return import_module(self.urlconf_name)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/homebrew/Cellar/python@3.12/3.12.2_1/Frameworks/Python.framework/Versions/3.12/lib/python3.12/importlib/__init__.py", line 90, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 995, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "/Users/sushovanadhikari/selu_research_project/be_enhanced_spam_detector/be_enhanced_spam_detector/urls.py", line 22, in <module>
    path('api/auth/', include('handle_auth.urls')),  # Include the auth app URLs
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/django/urls/conf.py", line 39, in include
    urlconf_module = import_module(urlconf_module)
                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/homebrew/Cellar/python@3.12/3.12.2_1/Frameworks/Python.framework/Versions/3.12/lib/python3.12/importlib/__init__.py", line 90, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 995, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "/Users/sushovanadhikari/selu_research_project/be_enhanced_spam_detector/handle_auth/urls.py", line 2, in <module>
    from .views import GoogleLogin
  File "/Users/sushovanadhikari/selu_research_project/be_enhanced_spam_detector/handle_auth/views.py", line 4, in <module>
    from rest_framework.views import APIView
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/rest_framework/views.py", line 17, in <module>
    from rest_framework.schemas import DefaultSchema
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/rest_framework/schemas/__init__.py", line 33, in <module>
    authentication_classes=api_settings.DEFAULT_AUTHENTICATION_CLASSES,
                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/rest_framework/settings.py", line 227, in __getattr__
    val = perform_import(val, attr)
          ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/rest_framework/settings.py", line 170, in perform_import
    return [import_from_string(item, setting_name) for item in val]
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/sushovanadhikari/selu_research_project/env/lib/python3.12/site-packages/rest_framework/settings.py", line 182, in import_from_string
    raise ImportError(msg)
ImportError: Could not import 'dj_rest_auth.jwt_auth.JWTCookieAuthentication' for API setting 'DEFAULT_AUTHENTICATION_CLASSES'. ModuleNotFoundError: No module named 'rest_framework_simplejwt'.