import { userMessage } from "@/lib/user-messages.js";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  useUpdateMutation,
  useGetMyAdmissionQuery,
} from "@/services/api/user/admissionApis.js";

export const useEditStudentDetails = () => {
  const [saveLoading, setSaveLoading] = useState(false);
  const {
    data: admission,
    refetch,
    isLoading: admissionDetailsLoading,
  } = useGetMyAdmissionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [update] = useUpdateMutation();
  const studentDetails = useMemo(() => admission || null, [admission]);

  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [editableFields, setEditableFields] = useState({});

  // Initialize userDetails when studentDetails is available
  useEffect(() => {
    if (!studentDetails) return;
    const clean = {
      fullName: studentDetails.fullName || "",
      email: studentDetails.email || "",
      contactNumber: studentDetails.contactNumber || "",
      dob: studentDetails.dob || "",
      address: studentDetails.address || "",
      zipCode: studentDetails.zipCode || "",
      city: studentDetails.city || "",
      state: studentDetails.state || "",
      country: studentDetails.country || "",
      gender: studentDetails.gender || "",
      status: studentDetails.status || "pending",
      selectedCourses: studentDetails.selectedCourses || [],
      notes: studentDetails.notes || "",
    };

    setUserDetails(clean);

    setEditableFields(
      Object.keys(clean).reduce((acc, key) => {
        // lock email and status editing from here
        acc[key] = false;
        return acc;
      }, {})
    );
  }, [studentDetails]);

  // Handle field edit mode
  const handleEdit = useCallback((field) => {
    setEditableFields((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Handle input change
  const handleChange = useCallback((e) => {
    setUserDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // Handle save
  const handleSave = useCallback(
    async (field, value) => {
      setSaveLoading(true);
      if (!value) {
        setError("Please complete this field before saving.");
        setSaveLoading(false);
        return;
      }

      try {
        await update({ [field]: value }).unwrap();
        setEditableFields((prev) => ({ ...prev, [field]: false }));
        refetch();
        setSaveLoading(false);
      } catch (error) {
        setError(userMessage(error, "We could not save your changes. Please try again."));
        setSaveLoading(false);
      }
    },
    [update, refetch]
  );

  // Handle cancel (reset to original fetched data)
  const handleCancel = useCallback(
    (field) => {
      setEditableFields((prev) => ({ ...prev, [field]: false }));
      setUserDetails((prev) => ({
        ...prev,
        [field]: studentDetails ? studentDetails[field] : prev[field],
      }));
    },
    [studentDetails]
  );

  return {
    userDetails,
    editableFields,
    handleEdit,
    handleChange,
    handleSave,
    handleCancel,
    studentDetails,
    error,
    admissionDetailsLoading,
    saveLoading,
  };
};
