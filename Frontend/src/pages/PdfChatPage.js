// // import React, { useState } from "react";
// // import { useTheme } from "../contexts/ThemeContext";
// // import { getPdfChatStyles } from "../styles/appStyles";
// // import SessionHistorySidebar from "../components/chat/SessionHistorySidebar";
// // import ChatAndAnalysisSection from "../components/chat/ChatAndAnalysisSection";
// // import PdfViewer from "../PdfViewer";
// // import apiClient from "../api/apiClient";

// // // New state for minimizing Persona & Job panel

// // const PdfChatPage = ({ userToken }) => {
// //   const [isPersonaMinimized, setIsPersonaMinimized] = useState(false);
// //   const { currentTheme } = useTheme();
// //   const styles = getPdfChatStyles(currentTheme);

// //   const [sessionId, setSessionId] = useState(null);
// //   const [analysisResult, setAnalysisResult] = useState(null);
// //   const [messages, setMessages] = useState([]);

// //   const [pdfs, setPdfs] = useState([]);
// //   const [selectedPDF, setSelectedPDF] = useState(null);
// //   const [persona, setPersona] = useState("");
// //   const [job, setJob] = useState("");
// //   const [filePromise, setFilePromise] = useState(null);
// //   const [targetPage, setTargetPage] = useState(1);

// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState("");
// //   const [translatedInsights, setTranslatedInsights] = useState(null);

// //   const [selectionInsights, setSelectionInsights] = useState(null);
// //   const [isSelectionLoading, setIsSelectionLoading] = useState(false);
// //   const [activeTab, setActiveTab] = useState("analysis");


// //   const handlePDFSelect = (pdf) => {
// //     if (selectedPDF?.name !== pdf.name) {
// //       setSelectedPDF(pdf);
// //       setFilePromise(pdf.arrayBuffer());
// //       setTargetPage(1);
// //     }
// //   };

// //   const handleFileChange = (event) => {
// //     const files = Array.from(event.target.files);
// //     const newPdfs = files.filter(
// //       (file) =>
// //         file.type === "application/pdf" &&
// //         !pdfs.some((p) => p.name === file.name)
// //     );
// //     setPdfs((prev) => [...prev, ...newPdfs]);
// //   };

// //   const handleStartAnalysis = async () => {
// //     if (pdfs.length === 0 || !persona || !job) {
// //       setError("Please upload PDFs and fill out both Persona and Job fields.");
// //       return;
// //     }

// //     setIsPersonaMinimized(true);

// //     setLoading(true);
// //     setError("");
// //     setTranslatedInsights(null);
// //     setAnalysisResult(null);

// //     const formData = new FormData();
// //     formData.append("persona", persona);
// //     formData.append("job_to_be_done", job);
// //     pdfs.forEach((pdfFile) => formData.append("files", pdfFile));

// //     if (sessionId) {
// //       formData.append("sessionId", sessionId);
// //     }

// //     try {
// //       const response = await apiClient.post("/analyze/", formData, {
// //         headers: { "Content-Type": "multipart/form-data" },
// //       });

// //       setSessionId(response.data.sessionId);
// //       setAnalysisResult(response.data.analysis);
// //       setMessages([
// //         {
// //           role: "bot",
// //           content: "Analysis complete! Here are the key insights.",
// //         },
// //       ]);
// //     } catch (err) {
// //       const errorMessage =
// //         err.response?.data?.detail ||
// //         "An unexpected error occurred during analysis.";
// //       setError(errorMessage);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleSendQuery = async (msg) => {
// //     if (!sessionId) return;
// //     const userMsg = { role: "user", content: msg };
// //     setMessages((prev) => [...prev, userMsg]);
// //     setLoading(true);
// //     try {
// //       const response = await apiClient.post("/chat/", {
// //         sessionId: sessionId,
// //         query: msg,
// //       });
// //       setMessages((prev) => [...prev, response.data]);
// //     } catch (err) {
// //       const errorMessage =
// //         err.response?.data?.detail || "Failed to get a response.";
// //       setMessages((prev) => [
// //         ...prev,
// //         { role: "bot", content: `Error: ${errorMessage}` },
// //       ]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleSelectSession = async (selectedSessionId) => {
// //     setLoading(true);
// //     setError("");
// //     setTranslatedInsights(null);
// //     try {
// //       const response = await apiClient.get(`/sessions/${selectedSessionId}`);
// //       const sessionData = response.data;
// //       setSessionId(selectedSessionId);
// //       setAnalysisResult(sessionData.analysis);
// //       setMessages(sessionData.chat_history);
// //       setPdfs([]);
// //       setSelectedPDF(null);
// //       setFilePromise(null);
// //       if (sessionData.file_paths && sessionData.file_paths.length > 0) {
// //         const filePromises = sessionData.file_paths.map(async (path) => {
// //           const fileName = path.split("/").pop();
// //           const fileResponse = await apiClient.get(path, {
// //             responseType: "blob",
// //           });
// //           return new File([fileResponse.data], fileName, {
// //             type: "application/pdf",
// //           });
// //         });
// //         const loadedPdfs = await Promise.all(filePromises);
// //         setPdfs(loadedPdfs);

// //         if (loadedPdfs.length > 0) {
// //           handlePDFSelect(loadedPdfs[0]);
// //         }
// //       } else {
// //         setPdfs([]);
// //         setSelectedPDF(null);
// //         setFilePromise(null);
// //       }
// //     } catch (err) {
// //       setError("Failed to load session.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleNewChat = () => {
// //     setSessionId(null);
// //     setAnalysisResult(null);
// //     setMessages([]);
// //     setPdfs([]);
// //     setSelectedPDF(null);
// //     setPersona("");
// //     setJob("");
// //     setError("");
// //     setTranslatedInsights(null);
// //     setSelectionInsights(null);
// //     setActiveTab("analysis");
// //   };

// //   const handleInsightClick = (insight) => {
// //     const pdfFile = pdfs.find((p) => p.name === insight.document);
// //     if (pdfFile) {
// //       if (selectedPDF?.name !== pdfFile.name) {
// //         setSelectedPDF(pdfFile);
// //         setFilePromise(pdfFile.arrayBuffer());
// //       }
// //       setTargetPage(insight.page_number || 1);
// //     }
// //   };

// //   const handleTextSelect = async (selectedText) => {
// //     if (!selectedText || isSelectionLoading) return;
// //     setIsSelectionLoading(true);
// //     setSelectionInsights(null);
// //     setActiveTab("selection");

// //     try {
// //       const response = await apiClient.post("/insights-on-selection", {
// //         text: selectedText,
// //       });
// //       setSelectionInsights(response.data);
// //     } catch (err) {
// //       console.error("Failed to get insights on selection:", err);
// //     } finally {
// //       setIsSelectionLoading(false);
// //     }
// //   };

// //   const handleRemovePdf = (pdfName) => {
// //     setPdfs((prev) => prev.filter((p) => p.name !== pdfName));
// //     // If the removed PDF was selected, reset selection
// //     if (selectedPDF?.name === pdfName) {
// //       setSelectedPDF(null);
// //       setFilePromise(null);
// //       setTargetPage(1);
// //     }
// //   };

// //   return (
// //     <div className="app-container" style={styles.appContainer}>
// //       <SessionHistorySidebar
// //         onSelectSession={handleSelectSession}
// //         onNewChat={handleNewChat}
// //         activeSessionId={sessionId}
// //         userToken={userToken}
// //       />
// //       <div className="main-content" style={styles.mainContent}>
// //         <div className="viewer-panel" style={styles.viewerPanel}>
// //           {filePromise && selectedPDF ? (
// //             <PdfViewer
// //               filePromise={filePromise}
// //               fileName={selectedPDF.name}
// //               pageNumber={targetPage}
// //               onTextSelect={handleTextSelect}
// //             />
// //           ) : (
// //             <div className="viewer-placeholder" style={styles.viewerPlaceholder}>
// //               <p>
// //                 {sessionId
// //                   ? "Select a PDF from the analysis to view it."
// //                   : "Upload and select a PDF to view it here."}
// //               </p>
// //             </div>
// //           )}
// //         </div>

// //         <div className="chat-panel" style={styles.chatPanel}>
// //           <div className="chat-controls" style={styles.chatControls}>
// //             <div className="pdf-list" style={styles.pdfList}>
// //               {pdfs.length === 0 ? (
// //                 // Show upload button initially
// //                 <>
// //                   <label
// //                     htmlFor="file-upload"
// //                     style={{
// //                       ...styles.uploadButton,
// //                       padding: "0.3rem 0.8rem",
// //                       fontSize: "0.85rem",
// //                       width: "120px",
// //                       textAlign: "center",
// //                       cursor: "pointer",
// //                     }}
// //                   >
// //                     Upload PDFs
// //                   </label>
// //                   <input
// //                     id="file-upload"
// //                     type="file"
// //                     accept="application/pdf"
// //                     multiple
// //                     onChange={handleFileChange}
// //                     style={{ display: "none" }}
// //                   />
// //                 </>
// //               ) : (
// //                 <>
// //                   {/* Small + button at the TOP */}
// //                   <label
// //                     htmlFor="file-upload"
// //                     style={{
// //                       cursor: "pointer",
// //                       display: "inline-block",
// //                       padding: "0.2rem 0.5rem", // tighter spacing
// //                       fontSize: "0.8rem", // smaller size
// //                       lineHeight: "1rem",
// //                       borderRadius: "50%",
// //                       background: "#e50914",
// //                       color: "white",
// //                       fontWeight: "bold",
// //                       textAlign: "center",
// //                       marginBottom: "0.5rem",
// //                     }}
// //                     title="Add more PDFs"
// //                   >
// //                     +
// //                   </label>
// //                   <input
// //                     id="file-upload"
// //                     type="file"
// //                     accept="application/pdf"
// //                     multiple
// //                     onChange={handleFileChange}
// //                     style={{ display: "none" }}
// //                   />

// //                   {/* Render the PDF list */}
// //                   {pdfs.map((pdf) => (
// //                     <div
// //                       key={pdf.name}
// //                       className="pdf-list-item"
// //                       style={{
// //                         ...styles.pdfListItem,
// //                         ...(selectedPDF?.name === pdf.name && {
// //                           background: "#333333",
// //                         }),
// //                         display: "flex",
// //                         alignItems: "center",
// //                         justifyContent: "space-between",
// //                         marginBottom: "0.5rem",
// //                         cursor: "pointer",
// //                         padding: "0.25rem 0.45rem",
// //                         fontSize: "0.75rem",
// //                       }}
// //                       onClick={() => handlePDFSelect(pdf)}
// //                     >
// //                       <span
// //                         style={{
// //                           flex: 1,
// //                           textAlign: "left",
// //                           fontSize: "0.75rem",
// //                         }}
// //                       >
// //                         {pdf.name}
// //                       </span>
// //                       <button
// //                         onClick={(e) => {
// //                           e.stopPropagation();
// //                           handleRemovePdf(pdf.name);
// //                         }}
// //                         style={{
// //                           marginLeft: "0.5rem",
// //                           color: "white",
// //                           background: "transparent",
// //                           border: "none",
// //                           cursor: "pointer",
// //                           fontWeight: "bold",
// //                           fontSize: "0.85rem",
// //                           lineHeight: "1",
// //                         }}
// //                         title="Remove PDF"
// //                       >
// //                         ×
// //                       </button>
// //                     </div>
// //                   ))}
// //                 </>
// //               )}
// //             </div>

// //             {/* Persona & Job Panel */}
// //             {!isPersonaMinimized && (
// //               <>
// //                 <input
// //                   className="persona-input"
// //                   type="text"
// //                   placeholder="Persona (e.g., 'a legal expert')"
// //                   value={persona}
// //                   onChange={(e) => setPersona(e.target.value)}
// //                   style={styles.input}
// //                 />
// //                 <textarea
// //                   className="job-textarea"
// //                   placeholder="Job to be done (e.g., 'summarize key risks')"
// //                   value={job}
// //                   onChange={(e) => setJob(e.target.value)}
// //                   style={{ ...styles.input, ...styles.textarea }}
// //                 />
// //               </>
// //             )}
// //             <div
// //               style={{
// //                 display: "flex",
// //                 alignItems: "center",
// //                 gap: "0.5rem",
// //                 marginTop: "0.5rem",
// //               }}
// //             >
// //               <button
// //                 onClick={handleStartAnalysis}
// //                 style={styles.button}
// //                 disabled={loading}
// //               >
// //                 {loading ? "Analyzing..." : "Generate Insights"}
// //               </button>

// //               {isPersonaMinimized && (
// //                 <button
// //                   onClick={() => setIsPersonaMinimized(false)}
// //                   style={{ ...styles.button, fontSize: "0.85rem" }}
// //                 >
// //                   🔼 Maximize Persona & Job
// //                 </button>
// //               )}
// //             </div>

// //             {error && (
// //               <p
// //                 style={{
// //                   color: "red",
// //                   fontSize: "0.9rem",
// //                   textAlign: "center",
// //                 }}
// //               >
// //                 {error}
// //               </p>
// //             )}
// //           </div>

// //           {!analysisResult ? (
// //             <div className="chat-box" style={styles.chatBox}>
// //               <div className="placeholder-text" style={styles.placeholderText}>
// //                 Upload documents and define your analysis goals to begin.
// //               </div>
// //             </div>
// //           ) : (
// //             <ChatAndAnalysisSection
// //               messages={messages}
// //               onSendMessage={handleSendQuery}
// //               loading={loading}
// //               analysisResult={analysisResult}
// //               onInsightClick={handleInsightClick}
// //               sessionId={sessionId}
// //               translatedInsights={translatedInsights}
// //               setTranslatedInsights={setTranslatedInsights}
// //               selectionInsights={selectionInsights}
// //               isSelectionLoading={isSelectionLoading}
// //               activeTab={activeTab}
// //               setActiveTab={setActiveTab}
// //               userToken={userToken}
// //             />
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default PdfChatPage;



// import React, { useState } from "react";
// import { useTheme } from "../contexts/ThemeContext";
// import { getPdfChatStyles } from "../styles/appStyles";
// import SessionHistorySidebar from "../components/chat/SessionHistorySidebar";
// import ChatAndAnalysisSection from "../components/chat/ChatAndAnalysisSection";
// import PdfViewer from "../PdfViewer";
// import apiClient from "../api/apiClient";

// const PdfChatPage = ({ userToken }) => {
//   const [isPersonaMinimized, setIsPersonaMinimized] = useState(false);
//   const { currentTheme } = useTheme();
//   const styles = getPdfChatStyles(currentTheme);

//   const [sessionId, setSessionId] = useState(null);
//   const [analysisResult, setAnalysisResult] = useState(null);
//   const [messages, setMessages] = useState([]);

//   const [pdfs, setPdfs] = useState([]);
//   const [selectedPDF, setSelectedPDF] = useState(null);
//   const [persona, setPersona] = useState("");
//   const [job, setJob] = useState("");
//   const [filePromise, setFilePromise] = useState(null);
//   const [targetPage, setTargetPage] = useState(1);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [translatedInsights, setTranslatedInsights] = useState(null);

//   const [selectionInsights, setSelectionInsights] = useState(null);
//   const [isSelectionLoading, setIsSelectionLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("analysis");

//   // FIX: Add a key that can be updated to force a refresh of the sidebar
//   const [sessionUpdateKey, setSessionUpdateKey] = useState(0);


//   const handlePDFSelect = (pdf) => {
//     if (selectedPDF?.name !== pdf.name) {
//       setSelectedPDF(pdf);
//       setFilePromise(pdf.arrayBuffer());
//       setTargetPage(1);
//     }
//   };

//   const handleFileChange = (event) => {
//     const files = Array.from(event.target.files);
//     const newPdfs = files.filter(
//       (file) =>
//         file.type === "application/pdf" &&
//         !pdfs.some((p) => p.name === file.name)
//     );
//     setPdfs((prev) => [...prev, ...newPdfs]);
//   };

//   const handleStartAnalysis = async () => {
//     if (pdfs.length === 0 || !persona || !job) {
//       setError("Please upload PDFs and fill out both Persona and Job fields.");
//       return;
//     }

//     setIsPersonaMinimized(true);

//     setLoading(true);
//     setError("");
//     setTranslatedInsights(null);
//     setAnalysisResult(null);

//     const formData = new FormData();
//     formData.append("persona", persona);
//     formData.append("job_to_be_done", job);
//     pdfs.forEach((pdfFile) => formData.append("files", pdfFile));

//     if (sessionId) {
//       formData.append("sessionId", sessionId);
//     }

//     try {
//       const response = await apiClient.post("/analyze/", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       setSessionId(response.data.sessionId);
//       setAnalysisResult(response.data.analysis);
//       setMessages([
//         {
//           role: "bot",
//           content: "Analysis complete! Here are the key insights.",
//         },
//       ]);
      
//       // FIX: Increment the key to trigger a refresh in the sidebar
//       setSessionUpdateKey(prevKey => prevKey + 1);

//     } catch (err) {
//       const errorMessage =
//         err.response?.data?.detail ||
//         "An unexpected error occurred during analysis.";
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSendQuery = async (msg) => {
//     if (!sessionId) return;
//     const userMsg = { role: "user", content: msg };
//     setMessages((prev) => [...prev, userMsg]);
//     setLoading(true);
//     try {
//       const response = await apiClient.post("/chat/", {
//         sessionId: sessionId,
//         query: msg,
//       });
//       setMessages((prev) => [...prev, response.data]);
//     } catch (err) {
//       const errorMessage =
//         err.response?.data?.detail || "Failed to get a response.";
//       setMessages((prev) => [
//         ...prev,
//         { role: "bot", content: `Error: ${errorMessage}` },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelectSession = async (selectedSessionId) => {
//     setLoading(true);
//     setError("");
//     setTranslatedInsights(null);
//     try {
//       const response = await apiClient.get(`/sessions/${selectedSessionId}`);
//       const sessionData = response.data;
//       setSessionId(selectedSessionId);
//       setAnalysisResult(sessionData.analysis);
//       setMessages(sessionData.chat_history);
//       setPdfs([]);
//       setSelectedPDF(null);
//       setFilePromise(null);
//       if (sessionData.file_paths && sessionData.file_paths.length > 0) {
//         const filePromises = sessionData.file_paths.map(async (path) => {
//           const fileName = path.split("/").pop();
//           const fileResponse = await apiClient.get(path, {
//             responseType: "blob",
//           });
//           return new File([fileResponse.data], fileName, {
//             type: "application/pdf",
//           });
//         });
//         const loadedPdfs = await Promise.all(filePromises);
//         setPdfs(loadedPdfs);

//         if (loadedPdfs.length > 0) {
//           handlePDFSelect(loadedPdfs[0]);
//         }
//       } else {
//         setPdfs([]);
//         setSelectedPDF(null);
//         setFilePromise(null);
//       }
//     } catch (err) {
//       setError("Failed to load session.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleNewChat = () => {
//     setSessionId(null);
//     setAnalysisResult(null);
//     setMessages([]);
//     setPdfs([]);
//     setSelectedPDF(null);
//     setPersona("");
//     setJob("");
//     setError("");
//     setTranslatedInsights(null);
//     setSelectionInsights(null);
//     setActiveTab("analysis");
//   };

//   const handleInsightClick = (insight) => {
//     const pdfFile = pdfs.find((p) => p.name === insight.document);
//     if (pdfFile) {
//       if (selectedPDF?.name !== pdfFile.name) {
//         setSelectedPDF(pdfFile);
//         setFilePromise(pdfFile.arrayBuffer());
//       }
//       setTargetPage(insight.page_number || 1);
//     }
//   };

//   const handleTextSelect = async (selectedText) => {
//     if (!selectedText || isSelectionLoading) return;
//     setIsSelectionLoading(true);
//     setSelectionInsights(null);
//     setActiveTab("selection");

//     try {
//       const response = await apiClient.post("/insights-on-selection", {
//         text: selectedText,
//       });
//       setSelectionInsights(response.data);
//     } catch (err) {
//       console.error("Failed to get insights on selection:", err);
//     } finally {
//       setIsSelectionLoading(false);
//     }
//   };

//   const handleRemovePdf = (pdfName) => {
//     setPdfs((prev) => prev.filter((p) => p.name !== pdfName));
//     if (selectedPDF?.name === pdfName) {
//       setSelectedPDF(null);
//       setFilePromise(null);
//       setTargetPage(1);
//     }
//   };

//   return (
//     <div className="app-container" style={styles.appContainer}>
//       <SessionHistorySidebar
//         onSelectSession={handleSelectSession}
//         onNewChat={handleNewChat}
//         activeSessionId={sessionId}
//         userToken={userToken}
//         sessionUpdateKey={sessionUpdateKey} 
//       />
//       <div className="main-content" style={styles.mainContent}>
//         <div className="viewer-panel" style={styles.viewerPanel}>
//           {filePromise && selectedPDF ? (
//             <PdfViewer
//               filePromise={filePromise}
//               fileName={selectedPDF.name}
//               pageNumber={targetPage}
//               onTextSelect={handleTextSelect}
//             />
//           ) : (
//             <div className="viewer-placeholder" style={styles.viewerPlaceholder}>
//               <p>
//                 {sessionId
//                   ? "Select a PDF from the analysis to view it."
//                   : "Upload and select a PDF to view it here."}
//               </p>
//             </div>
//           )}
//         </div>

//         <div className="chat-panel" style={styles.chatPanel}>
//           <div className="chat-controls" style={styles.chatControls}>
//             <div className="pdf-list" style={styles.pdfList}>
//               {pdfs.length === 0 ? (
//                 <>
//                   <label
//                     htmlFor="file-upload"
//                     style={{
//                       ...styles.uploadButton,
//                       padding: "0.3rem 0.8rem",
//                       fontSize: "0.85rem",
//                       width: "120px",
//                       textAlign: "center",
//                       cursor: "pointer",
//                     }}
//                   >
//                     Upload PDFs
//                   </label>
//                   <input
//                     id="file-upload"
//                     type="file"
//                     accept="application/pdf"
//                     multiple
//                     onChange={handleFileChange}
//                     style={{ display: "none" }}
//                   />
//                 </>
//               ) : (
//                 <>
//                   <label
//                     htmlFor="file-upload"
//                     style={{
//                       cursor: "pointer",
//                       display: "inline-block",
//                       padding: "0.2rem 0.5rem",
//                       fontSize: "0.8rem",
//                       lineHeight: "1rem",
//                       borderRadius: "50%",
//                       background: "#e50914",
//                       color: "white",
//                       fontWeight: "bold",
//                       textAlign: "center",
//                       marginBottom: "0.5rem",
//                     }}
//                     title="Add more PDFs"
//                   >
//                     +
//                   </label>
//                   <input
//                     id="file-upload"
//                     type="file"
//                     accept="application/pdf"
//                     multiple
//                     onChange={handleFileChange}
//                     style={{ display: "none" }}
//                   />
//                   {pdfs.map((pdf) => (
//                     <div
//                       key={pdf.name}
//                       className="pdf-list-item"
//                       style={{
//                         ...styles.pdfListItem,
//                         ...(selectedPDF?.name === pdf.name && {
//                           background: "#333333",
//                         }),
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "space-between",
//                         marginBottom: "0.5rem",
//                         cursor: "pointer",
//                         padding: "0.25rem 0.45rem",
//                         fontSize: "0.75rem",
//                       }}
//                       onClick={() => handlePDFSelect(pdf)}
//                     >
//                       <span
//                         style={{
//                           flex: 1,
//                           textAlign: "left",
//                           fontSize: "0.75rem",
//                         }}
//                       >
//                         {pdf.name}
//                       </span>
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleRemovePdf(pdf.name);
//                         }}
//                         style={{
//                           marginLeft: "0.5rem",
//                           color: "white",
//                           background: "transparent",
//                           border: "none",
//                           cursor: "pointer",
//                           fontWeight: "bold",
//                           fontSize: "0.85rem",
//                           lineHeight: "1",
//                         }}
//                         title="Remove PDF"
//                       >
//                         ×
//                       </button>
//                     </div>
//                   ))}
//                 </>
//               )}
//             </div>

//             {!isPersonaMinimized && (
//               <>
//                 <input
//                   className="persona-input"
//                   type="text"
//                   placeholder="Persona (e.g., 'a legal expert')"
//                   value={persona}
//                   onChange={(e) => setPersona(e.target.value)}
//                   style={styles.input}
//                 />
//                 <textarea
//                   className="job-textarea"
//                   placeholder="Job to be done (e.g., 'summarize key risks')"
//                   value={job}
//                   onChange={(e) => setJob(e.target.value)}
//                   style={{ ...styles.input, ...styles.textarea }}
//                 />
//               </>
//             )}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "0.5rem",
//                 marginTop: "0.5rem",
//               }}
//             >
//               <button
//                 onClick={handleStartAnalysis}
//                 style={styles.button}
//                 disabled={loading}
//               >
//                 {loading ? "Analyzing..." : "Generate Insights"}
//               </button>

//               {isPersonaMinimized && (
//                 <button
//                   onClick={() => setIsPersonaMinimized(false)}
//                   style={{ ...styles.button, fontSize: "0.85rem" }}
//                 >
//                   🔼 Maximize Persona & Job
//                 </button>
//               )}
//             </div>

//             {error && (
//               <p
//                 style={{
//                   color: "red",
//                   fontSize: "0.9rem",
//                   textAlign: "center",
//                 }}
//               >
//                 {error}
//               </p>
//             )}
//           </div>

//           {!analysisResult ? (
//             <div className="chat-box" style={styles.chatBox}>
//               <div className="placeholder-text" style={styles.placeholderText}>
//                 Upload documents and define your analysis goals to begin.
//               </div>
//             </div>
//           ) : (
//             <ChatAndAnalysisSection
//               messages={messages}
//               onSendMessage={handleSendQuery}
//               loading={loading}
//               analysisResult={analysisResult}
//               onInsightClick={handleInsightClick}
//               sessionId={sessionId}
//               translatedInsights={translatedInsights}
//               setTranslatedInsights={setTranslatedInsights}
//               selectionInsights={selectionInsights}
//               isSelectionLoading={isSelectionLoading}
//               activeTab={activeTab}
//               setActiveTab={setActiveTab}
//               userToken={userToken}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PdfChatPage;


import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { getPdfChatStyles } from "../styles/appStyles";
import SessionHistorySidebar from "../components/chat/SessionHistorySidebar";
import ChatAndAnalysisSection from "../components/chat/ChatAndAnalysisSection";
import PdfViewer from "../PdfViewer";
import apiClient from "../api/apiClient";

const PdfChatPage = ({ userToken }) => {
  const [isPersonaMinimized, setIsPersonaMinimized] = useState(false);
  const { currentTheme } = useTheme();
  const styles = getPdfChatStyles(currentTheme);
  const [messages, setMessages] = useState([]); // FIX: Ensures setMessages is always declared

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [persona, setPersona] = useState("");
  const [job, setJob] = useState("");
  const [filePromise, setFilePromise] = useState(null);
  const [targetPage, setTargetPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [translatedInsights, setTranslatedInsights] = useState(null);
  const [selectionInsights, setSelectionInsights] = useState(null);
  const [isSelectionLoading, setIsSelectionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");


  // FIX: Add a key that can be updated to force a refresh of the sidebar
  const [sessionUpdateKey, setSessionUpdateKey] = useState(0);



  const handlePDFSelect = (pdf) => {
    if (selectedPDF?.name !== pdf.name) {
      setSelectedPDF(pdf);
      setFilePromise(pdf.arrayBuffer());
      setTargetPage(1);
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const newPdfs = files.filter(
      (file) =>
        file.type === "application/pdf" &&
        !pdfs.some((p) => p.name === file.name)
    );
    setPdfs((prev) => [...prev, ...newPdfs]);
  };

  const handleStartAnalysis = async () => {
    if (pdfs.length === 0 || !persona || !job) {
      setError("Please upload PDFs and fill out both Persona and Job fields.");
      return;
    }

    setIsPersonaMinimized(true);

    setLoading(true);
    setError("");
    setTranslatedInsights(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append("persona", persona);
    formData.append("job_to_be_done", job);
    pdfs.forEach((pdfFile) => formData.append("files", pdfFile));

    if (sessionId) {
      formData.append("sessionId", sessionId);
    }

    try {
      const response = await apiClient.post("/analyze/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSessionId(response.data.sessionId);
      setAnalysisResult(response.data.analysis);

      setMessages([
        {
          role: "bot",
          content: "Analysis complete! Here are the key insights.",
        },
      ]);
      
      // FIX: Increment the key to trigger a refresh in the sidebar
      setSessionUpdateKey(prevKey => prevKey + 1);


    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        "An unexpected error occurred during analysis.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (selectedSessionId) => {
    setLoading(true);
    setError("");
    setTranslatedInsights(null);
    setIsSidebarOpen(false);
    try {
      const response = await apiClient.get(`/sessions/${selectedSessionId}`);
      const sessionData = response.data;
      setSessionId(selectedSessionId);
      setAnalysisResult(sessionData.analysis);
      setPdfs([]);
      setSelectedPDF(null);
      setFilePromise(null);
      if (sessionData.file_paths && sessionData.file_paths.length > 0) {
        const filePromises = sessionData.file_paths.map(async (path) => {
          const fileName = path.split("/").pop();
          const fileResponse = await apiClient.get(path, {
            responseType: "blob",
          });
          return new File([fileResponse.data], fileName, {
            type: "application/pdf",
          });
        });
        const loadedPdfs = await Promise.all(filePromises);
        setPdfs(loadedPdfs);

        if (loadedPdfs.length > 0) {
          handlePDFSelect(loadedPdfs[0]);
        }
      } else {
        setPdfs([]);
        setSelectedPDF(null);
        setFilePromise(null);
      }
    } catch (err) {
      setError("Failed to load session.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setAnalysisResult(null);
    setPdfs([]);
    setSelectedPDF(null);
    setPersona("");
    setJob("");
    setError("");
    setTranslatedInsights(null);
    setSelectionInsights(null);
    setActiveTab("analysis");
    setIsSidebarOpen(false);
  };

  const handleInsightClick = (insight) => {
    const pdfFile = pdfs.find((p) => p.name === insight.document);
    if (pdfFile) {
      if (selectedPDF?.name !== pdfFile.name) {
        setSelectedPDF(pdfFile);
        setFilePromise(pdfFile.arrayBuffer());
      }
      setTargetPage(insight.page_number || 1);
    }
  };

  const handleTextSelect = async (selectedText) => {
    if (!selectedText || isSelectionLoading) return;
    setIsSelectionLoading(true);
    setSelectionInsights(null);
    setActiveTab("selection");

    try {
      const response = await apiClient.post("/insights-on-selection", {
        text: selectedText,
      });
      setSelectionInsights(response.data);
    } catch (err) {
      console.error("Failed to get insights on selection:", err);
    } finally {
      setIsSelectionLoading(false);
    }
  };

  const handleRemovePdf = (pdfName) => {
    setPdfs((prev) => prev.filter((p) => p.name !== pdfName));
    if (selectedPDF?.name === pdfName) {
      setSelectedPDF(null);
      setFilePromise(null);
      setTargetPage(1);
    }
  };

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`} style={styles.appContainer}>
      <SessionHistorySidebar
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        activeSessionId={sessionId}
        userToken={userToken}

        sessionUpdateKey={sessionUpdateKey} 

      />
      <div className="main-content" style={styles.mainContent}>
        <div className="viewer-panel" style={styles.viewerPanel}>
          {filePromise && selectedPDF ? (
            <PdfViewer
              filePromise={filePromise}
              fileName={selectedPDF.name}
              pageNumber={targetPage}
              onTextSelect={handleTextSelect}
            />
          ) : (
            <div className="viewer-placeholder" style={styles.viewerPlaceholder}>
              <p>
                {sessionId
                  ? "Select a PDF from the analysis to view it."
                  : "Upload and select a PDF to view it here."}
              </p>
            </div>
          )}
        </div>

        <div className="chat-panel" style={styles.chatPanel}>
           <div className="chat-controls" style={styles.chatControls}>
            <div className="pdf-list" style={styles.pdfList}>
              {pdfs.length === 0 ? (
                <>
                  <label
                    htmlFor="file-upload"
                    className="action-button" // ADDED CLASS
                    style={{ // Custom styles for this specific button
                      padding: "0.5rem 1rem",
                      fontSize: "0.9rem",
                      width: "auto", // Allow button to size to content
                      flexShrink: 0,
                    }}
                  >
                    Upload PDFs
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </>
              ) : (
                <>
                  <label
                    htmlFor="file-upload"
                    style={{
                      cursor: "pointer",
                      display: "inline-block",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.8rem",
                      lineHeight: "1rem",
                      borderRadius: "50%",
                      background: "#e50914",
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                      marginBottom: "0.5rem",
                    }}
                    title="Add more PDFs"
                  >
                    +
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />


                  {pdfs.map((pdf) => (
                    <div
                      key={pdf.name}
                      className="pdf-list-item"
                      style={{
                        ...styles.pdfListItem,
                        ...(selectedPDF?.name === pdf.name && styles.activePdfListItem),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                        cursor: "pointer",
                        padding: "0.25rem 0.45rem",
                        fontSize: "0.75rem",
                      }}
                      onClick={() => handlePDFSelect(pdf)}
                    >
                      <span
                        style={{
                          flex: 1,
                          textAlign: "left",
                          fontSize: "0.75rem",
                        }}
                      >
                        {pdf.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePdf(pdf.name);
                        }}
                        style={{
                          marginLeft: "0.5rem",
                          color: styles.pdfListItem.color,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          lineHeight: "1",
                        }}
                        title="Remove PDF"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            {!isPersonaMinimized && (
              <>
                <input
                  className="persona-input"
                  type="text"
                  placeholder="Persona (e.g., 'a legal expert')"
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  style={styles.input}
                />
                <textarea
                  className="job-textarea"
                  placeholder="Job to be done (e.g., 'summarize key risks')"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  style={{ ...styles.input, ...styles.textarea }}
                />
              </>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                onClick={handleStartAnalysis}
                className="action-button" // ADDED CLASS
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Generate Insights"}
              </button>

              {isPersonaMinimized && (
                <button
                  onClick={() => setIsPersonaMinimized(false)}
                  className="action-button" // ADDED CLASS
                  style={{ fontSize: "0.85rem" }} // Keep specific style override if needed
                >
                  🔼 Maximize Persona & Job
                </button>
              )}
            </div>

            {error && (
              <p
                style={{
                  color: "red",
                  fontSize: "0.9rem",
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}
          </div>

          {!analysisResult ? (
            <div className="placeholder-text" style={{...styles.placeholderText, flex: 1, display: 'flex', alignItems: 'center'}}>
              Upload documents and define your analysis goals to begin.
            </div>
          ) : (
            <ChatAndAnalysisSection
              loading={loading}
              analysisResult={analysisResult}
              onInsightClick={handleInsightClick}
              sessionId={sessionId}
              translatedInsights={translatedInsights}
              setTranslatedInsights={setTranslatedInsights}
              selectionInsights={selectionInsights}
              isSelectionLoading={isSelectionLoading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              userToken={userToken}
            />
          )}
        </div>
      </div>
    </div>
  );
};


export default PdfChatPage;
