package com.forma.login;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.io.Serializable;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LoginUserVo implements Serializable {
    private String userId;
    private String userName;
    private String userDeptCode;
    private String userDeptName;
    private String userIp;
    private boolean admin;
    private String field;
    private String today;

    public static LoginUserVo systemUser() {
        LoginUserVo vo = new LoginUserVo();
        vo.setUserId("system");
        vo.setUserName("시스템");
        vo.setUserDeptCode("");
        vo.setUserDeptName("");
        vo.setUserIp("127.0.0.1");
        vo.setAdmin(true);
        return vo;
    }
}
