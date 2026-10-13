(function registerChangePasswordPage(app) {
  const {
    Button,
    Card,
    Form,
    Input,
    Typography,
    message
  } = antd;
  const { Text } = Typography;
  const e = React.createElement;

  // 与参考系统一致：大小写字母 + 数字，长度 8-24 位
  const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,24}$/;

  function ChangePasswordPage() {
    const [form] = Form.useForm();

    function handleSubmit(values) {
      if (values.new_passwd !== values.conf_passwd) {
        message.error("两次输入的密码不一致");
        return;
      }
      message.success("密码修改成功");
      message.info("已退出登录，请重新登录（原型演示）");
      form.resetFields();
    }

    return e("section", { className: "page-surface" }, [
      e(Card, { title: "修改密码" }, [
      e(Text, {
        key: "hint",
        type: "secondary",
        style: { display: "block", marginBottom: 12 }
      }, "密码需包含大小写字母和数字，长度 8-24 位"),
      e(Form, {
        key: "form",
        form,
        layout: "vertical",
        style: { maxWidth: 480 },
        onFinish: handleSubmit
      }, [
        e(Form.Item, {
          key: "old",
          label: "旧密码",
          name: "old_passwd",
          rules: [{ required: true, message: "请输入旧密码" }]
        },
          e(Input.Password, { placeholder: "旧密码" })),
        e(Form.Item, {
          key: "new",
          label: "新密码",
          name: "new_passwd",
          rules: [
            { required: true, message: "请输入新密码" },
            { pattern: PASSWORD_PATTERN, message: "密码需包含大小写字母和数字，长度 8-24 位" }
          ]
        },
          e(Input.Password, { placeholder: "新密码" })),
        e(Form.Item, {
          key: "confirm",
          label: "确认新密码",
          name: "conf_passwd",
          dependencies: ["new_passwd"],
          rules: [
            { required: true, message: "请再次输入新密码" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                return !value || getFieldValue("new_passwd") === value
                  ? Promise.resolve()
                  : Promise.reject(new Error("两次输入的密码不一致"));
              }
            })
          ]
        },
          e(Input.Password, { placeholder: "确认新密码" })),
        e(Form.Item, { key: "submit" },
          e(Button, { type: "primary", htmlType: "submit" }, "提交"))
      ])
    ])
    ]);
  }

  app.ChangePasswordPage = ChangePasswordPage;
})(window.AdminApp);
