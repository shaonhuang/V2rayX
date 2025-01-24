import { useEffect, useRef } from 'react';

// Ensure that MonacoEnvironment is defined only once
if (typeof self !== 'undefined' && !self.MonacoEnvironment) {
  self.MonacoEnvironment = {
    getWorker(_, label) {
      const getWorkerModule = (workerPath, name) => {
        return new Worker(new URL(workerPath, import.meta.url), {
          name,
          type: 'module',
        });
      };

      switch (label) {
        case 'json':
          return getWorkerModule(
            'monaco-editor/esm/vs/language/json/json.worker?worker',
            label,
          );
        // Uncomment and add other cases as needed
        // case 'css':
        // case 'scss':
        // case 'less':
        //   return getWorkerModule(
        //     'monaco-editor/esm/vs/language/css/css.worker?worker',
        //     label
        //   );
        // case 'html':
        // case 'handlebars':
        // case 'razor':
        //   return getWorkerModule(
        //     'monaco-editor/esm/vs/language/html/html.worker?worker',
        //     label
        //   );
        // case 'typescript':
        // case 'javascript':
        //   return getWorkerModule(
        //     'monaco-editor/esm/vs/language/typescript/ts.worker?worker',
        //     label
        //   );
        default:
          return getWorkerModule(
            'monaco-editor/esm/vs/editor/editor.worker?worker',
            label,
          );
      }
    },
  };
}

const Editor = ({
  className = '',
  defaultLanguage = 'javascript',
  defaultValue = '',
  onChange,
  options = {},
}) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null); // To store the monaco instance
  const initializationRef = useRef(false); // To prevent multiple initializations

  useEffect(() => {
    let isMounted = true; // To prevent state updates after unmount

    const initializeMonaco = async () => {
      if (initializationRef.current) {
        // Prevent multiple initializations
        return;
      }

      initializationRef.current = true;

      try {
        // Dynamically import monaco-editor
        const monaco = await import('monaco-editor');
        monacoRef.current = monaco;

        if (containerRef.current && isMounted) {
          // Create the editor
          editorRef.current = monaco.editor.create(containerRef.current, {
            value: defaultValue,
            language: defaultLanguage,
            automaticLayout: true, // Adjust layout on container resize
            ...options,
          });

          // Listen to changes and propagate them up
          const model = editorRef.current.getModel();
          if (model && onChange) {
            const subscription = model.onDidChangeContent(() => {
              const currentValue = model.getValue();
              onChange(currentValue);
            });

            // Store the subscription for cleanup
            editorRef.current.__subscription = subscription;
          }
        }
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
      }
    };

    initializeMonaco();

    // Cleanup function
    return () => {
      isMounted = false;
      if (editorRef.current) {
        // Dispose of the editor instance
        if (editorRef.current.__subscription) {
          editorRef.current.__subscription.dispose();
        }
        editorRef.current.dispose();
        editorRef.current = null;
      }
      initializationRef.current = false;
    };
  }, []); // Empty dependency array ensures this runs once

  // Handle defaultLanguage changes
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const monaco = monacoRef.current;
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, defaultLanguage);
      }
    }
  }, [defaultLanguage]);

  // Handle defaultValue changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== defaultValue) {
        editorRef.current.pushUndoStop();
        model.setValue(defaultValue);
        editorRef.current.pushUndoStop();
      }
    }
  }, [defaultValue]);

  // Handle options changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions(options);
    }
  }, [options]);

  return (
    <div
      ref={containerRef}
      className={className} // For example, "h-48" with Tailwind
      style={{
        border: '1px solid #ddd',
      }}
    />
  );
};

export default Editor;
